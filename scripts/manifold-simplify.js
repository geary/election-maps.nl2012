var allErrors = [], errors = [];

function Main() {
	Clean();
	ImportSimplifyExport();
	if( allErrors.length ) {
		Application.MessageBox( allErrors.join('\n'), 'Simplify' );
	}
}

function Clean() {
	ForAllShapes( function( shpNameFull, shpNameSimple ) {
		RemoveDrawing( shpNameFull );
		RemoveDrawing( shpNameSimple );
		DeleteFolder( ShapeFolder(shpNameSimple) );
	});
}

function ImportSimplifyExport() {
	ForAllShapes( function( shpNameFull, shpNameSimple, tolerance, tolerance2 ) {
		ImportShape( shpNameFull );
		var drawingSimple = Simplify( shpNameFull, shpNameSimple, tolerance, tolerance2 );
		if( drawingSimple ) ExportShape( drawingSimple, shpNameSimple );

		RemoveDrawing( shpNameFull );
		RemoveDrawing( shpNameSimple );
	});
}

function ForAllShapes( callback ) {

	function go( res, table, tol, tol2 ) {
		var shpNameBase = S( 'us2012-', table, '-', res, '-' );
		var shpNameFull = S( shpNameBase, 'full' );
		var shpNameSimple = S( shpNameBase, tol );
		callback( shpNameFull, shpNameSimple, tol, tol2 );
	}
	
/*
	go( '500k', 'county99', '4096' );
	go( '500k', 'county02', '32768' );
	go( '500k', 'county15', '4096' );
*/

	go( '500k', 'gop2012nat', '4096', '32768' );
	go( '500k', 'gop2012loc', '512', '4096' );
}

function RemoveDrawing( shpName ) {
	var index = DrawingIndex( shpName );
	if( index >= 0 ) Document.ComponentSet.Remove( index );
}

function ImportShape( shpName ) {
	var imp = Document.NewImport( 'SHP' );
	imp.ConvertPolicy = Manifold.ConvertAll;
	imp.Import( ShapePath(shpName), PromptNone );
}

function CopyColumn( columnSetTo, columnSetFrom, name ) {
	var columnFrom = GetByName( columnSetFrom, name );
	var columnTo = columnSetTo.NewColumn();
	columnTo.CodePage = columnFrom.CodePage;
	columnTo.Name = columnFrom.Name;
	columnTo.Size = columnFrom.Size;
	columnTo.Type = columnFrom.Type;
	columnSetTo.Add( columnTo );
}

function SplitGeomSet( geomSet, recordSet ) {
	var objectSets = {
		AK: Document.NewObjectSet(),
		US: Document.NewObjectSet()
	};
	ForEach( recordSet, function( record, i ) {
		objectSets[
			record.Data('STATE') == '02' ? 'AK' : 'US'
		].Add( CopyGeom( geomSet(i) ) );
	});
	return geomSets;
}

function CombineGeomSets( geomSets, recordSet ) {
	var geomSet = Document.NewObjectSet().GeomSet;
	var iAK = 0, iUS = 0;
	ForEach( recordSet, function( record, i ) {
		geomSet.Add( CopyGeom(
			record.Data('STATE') == '02' ?
				geomSets.AK(iAK++) :
				geomSets.US(iUS++)
		) );
	});
}

function CopyGeom( geom ) {
	return Application.NewGeomFromTextWKT( geom.ToTextWKT() );
}

function Drawing( drawing ) {
	this.drawing = drawing;
	this.objectSet = drawing.ObjectSet;
	this.geomSet = this.objectSet.GeomSet;
	this.table = drawing.OwnedTable;
	this.columnSet = this.table.ColumnSet;
	this.recordSet = this.table.RecordSet;
}

var colNames = 'GEO_ID,STATE,NAME,LSAD,CENSUSAREA,FULL_GEOM'.split(',');

function SelectStateInto( dest, source, state ) {
	ForEach( source.recordSet, function( record, i ) {
		source.objectSet( i ).Selected = ( record.Data('STATE') == state );
	});
/*
	var query = Document.NewQuery( 'SelectState', true );
	query.Text = S(
		'INSERT INTO [',
			dest.drawing.Name,
		'] SELECT [', colNames.join('],['), '] FROM [',
			source.drawing.Name,
		'] WHERE [STATE] = "',
			state,
		'";'
	);
	query.Run();
	var i = 1;
*/
}

function Simplify( shpNameFull, shpNameSimple, tolerance, toleranceAK ) {
	var fullDrawing = GetDrawing( shpNameFull );
	var full = new Drawing( fullDrawing );
	
	var simple = new Drawing( Document.NewDrawing(
		DrawingName(shpNameSimple),
		full.drawing.CoordinateSystem,
		false
	) );
	
	ForEach( colNames, function( name ) {
		CopyColumn( simple.columnSet, full.columnSet, name );
	});
	
	var shpNameTemp = shpNameFull + '-Temp';
	var temp = new Drawing( Document.NewDrawing(
		DrawingName(shpNameTemp),
		full.drawing.CoordinateSystem,
		false
	) );
	
/*
	ForEach( colNames, function( name ) {
		CopyColumn( temp.columnSet, full.columnSet, name );
	});
*/
	
	SelectStateInto( temp, full, '02' );
	full.drawing.Cut( true );
	full = new Drawing( fullDrawing );  // TODO: better way to update this?
	temp.drawing.Paste();
	
	SimplifyPart( temp, simple, shpNameSimple, colNames, toleranceAK );
	SimplifyPart( full, simple, shpNameSimple, colNames, tolerance );
	
	RemoveDrawing( shpNameTemp );
	
	return simple.drawing;
}

function SimplifyPart( source, simple, shpNameSimple, colNames, tolerance ) {
	var geomSetSimple = source.geomSet.NormalizeTopology( tolerance );
	if( source.objectSet.Count != geomSetSimple.Count ) {
		errors.push( S(
			'Object set length mismatch: ', shpNameSimple
		) );
		return null;
	}

	// I am assuming that source.objectSet and geomSetSimple are in the same order!
	for( var i = 0, n = geomSetSimple.Count;  i < n;  ++i ) {
		var object = source.objectSet( i );
		var geom = geomSetSimple( i );
		try {
			simple.objectSet.Add( geom );
			var recordFull =
				GetByID( source.recordSet, object.ID );
			var recordSimple =
				GetByID( simple.recordSet, simple.objectSet.LastAdded.ID );
			ForEach( colNames, function( name ) {
				recordSimple.Data(name) = recordFull.Data(name);
			});
		}
		catch( e ) {
			var record = object.Record;
			errors.push( S(
				e.name, ' (', e.description, '): ', shpNameSimple, '[', i, ']: ',
				record.Data('GEO_ID'), ' ', record.Data('NAME')
			) );
/*
			var center = source.geomSet( i ).Center;
			var xy = S( center.X, ' ', center.Y );
			var wkt = S( 'MULTIPOLYGON (((', xy, ', ', xy, ', ', xy, ', ', xy, ')))' );
			geom = Application.NewGeomFromTextWKT( wkt );
			simple.objectSet.Add( geom );
*/
		}
/*
		var recordFull =
			GetByID( source.recordSet, object.ID );
		var recordSimple =
			GetByID( simple.recordSet, simple.objectSet.LastAdded.ID );
		ForEach( colNames, function( name ) {
			recordSimple.Data(name) = recordFull.Data(name);
		});
*/
	}
}

function ExportShape( drawing, shpNameExport ) {
	var exp = Document.NewExport( 'SHP' );
	var folder = ShapeFolder(shpNameExport), path = ShapePath(shpNameExport);
	DeleteFolder( folder );
	CreateFolder( folder );
	exp.Export( drawing, path, PromptNone );
	if( errors ) {
		WriteTextFile( S( folder, '\\errors.txt' ), errors.join('\r\n') );
		allErrors.concat( errors );
		errors.length = 0;
	}
}

function GetByID( set, id ) {
	return set( set.ItemByID(id) );
}

function GetByName( set, name ) {
	return set( set.ItemByName(name) );
}

function GetDrawing( shpName ) {
	var index = DrawingIndex( shpName );
	return index >= 0 && Document.ComponentSet( index );
}

function DrawingIndex( shpName ) {
	return Document.ComponentSet.ItemByName( DrawingName(shpName) );
}

function DrawingName( shpName ) {
	return S( shpName, ' Drawing' );
}

function ShapePath( shpName ) {
	return S( ShapeFolder(shpName), '\\', shpName, '.shp'  );
}

function ShapeFolder( shpName ) {
	return Document.Path.replace(
		/\\scripts\\[^\\]+$/,
		'\\shapes\\shp\\' + shpName
	);
}

function CreateFolder( folder ) {
	var fso = FSO();
	fso.CreateFolder( folder );
}

function DeleteFolder( folder ) {
	var fso = FSO();
	if( fso.FolderExists(folder) ) fso.DeleteFolder( folder );
}

function WriteTextFile( path, text ) {
	var fso = FSO();
	var fsoForWriting = 2;
	var stream = fso.OpenTextFile( path, fsoForWriting, true );
	stream.Write( text );
	stream.Close();
}

function FSO() {
	return new ActiveXObject( 'Scripting.FileSystemObject' );
}

function S() {
	return Array.prototype.join.call( arguments, '' );
}

function ForEach( set, callback ) {
	if( set instanceof Array ) {
		for( var i = 0, n = set.length;  i < n;  ++i ) {
			callback( set[i], i );
		}
	}
	else {
		for( var i = 0, n = set.Count;  i < n;  ++i ) {
			callback( set(i), i );
		}
	}
}
