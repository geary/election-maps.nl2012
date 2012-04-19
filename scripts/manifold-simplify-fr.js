var timeStart = +new Date;

var allErrors = [], errors = [];

var tables = {
	departement: {
		columns: 'ID_GEOFLA,CODE_DEPT,NOM_DEPT,CODE_CHF,NOM_CHF,X_CHF_LIEU,Y_CHF_LIEU,X_CENTROID,Y_CENTROID,CODE_REG,NOM_REGION,FULL_GEOM',
		errcols: 'ID_GEOFLA,CODE_DEPT,NOM_DEPT'
	},
	commune: {
		columns: 'ID_GEOFLA,CODE_COMM,INSEE_COM,NOM_COMM,STATUT,X_CHF_LIEU,Y_CHF_LIEU,X_CENTROID,Y_CENTROID,Z_MOYEN,SUPERFICIE,POPULATION,CODE_CANT,CODE_ARR,CODE_DEPT,NOM_DEPT,CODE_REG,NOM_REGION,FULL_GEOM',
		errcols: 'ID_GEOFLA,CODE_DEPT,NOM_DEPT,CODE_COMM,NOM_COMM'
	}
};

(function() {
	for( var name in tables ) {
		var table = tables[name];
		table.name = name;
		table.columns = table.columns.split(',');
		table.errcols = table.errcols.split(',');
	}
})();

function Main() {
	Clean();
	ImportSimplifyExport();
	if( allErrors.length ) {
		Application.MessageBox( allErrors.join('\n'), 'Simplify' );
	}
}

function Clean() {
	ForAllShapes( function( table ) {
		RemoveDrawing( table.shpNameFull );
		RemoveDrawing( table.shpNameSimple );
		DeleteFolder( ShapeFolder(table.shpNameSimple) );
	});
}

function ImportSimplifyExport() {
	ForAllShapes( function( table, tolerance, tolerance2 ) {
		Log( 'Importing ', table.name );
		ImportShape( table.shpNameFull );
		Log( 'Simplifying ', table.name );
		var drawingSimple = Simplify( table, tolerance, tolerance2 );
		Log( 'Exporting ', table.name );
		if( drawingSimple ) ExportShape( drawingSimple, table.shpNameSimple );

		RemoveDrawing( table.shpNameFull );
		RemoveDrawing( table.shpNameSimple );
	});
}

function ForAllShapes( callback ) {

	function go( tableName, tol, tol2 ) {
		var table = tables[tableName];
		var shpNameBase = S( 'fr2012-', table.name, '-' );
		table.shpNameFull = S( shpNameBase, 'full' );
		table.shpNameSimple = S( shpNameBase, tol );
		callback( table, tol, tol2 );
	}
	
	go( 'departement', '512' );
	go( 'departement', '1024' );
	go( 'departement', '2048' );
	go( 'departement', '4096' );
	go( 'departement', '8192' );
	
	//go( 'commune', '512' );
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

/*
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
*/

/*
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
*/

/*
function CopyGeom( geom ) {
	return Application.NewGeomFromTextWKT( geom.ToTextWKT() );
}
*/

function Drawing( drawing ) {
	this.drawing = drawing;
	this.objectSet = drawing.ObjectSet;
	this.geomSet = this.objectSet.GeomSet;
	this.table = drawing.OwnedTable;
	this.columnSet = this.table.ColumnSet;
	this.recordSet = this.table.RecordSet;
}

function SelectStateInto( dest, source, state ) {
	ForEach( source.recordSet, function( record, i ) {
		source.objectSet( i ).Selected = ( record.Data('STATE') == state );
	});
/*
	var query = Document.NewQuery( 'SelectState', true );
	query.Text = S(
		'INSERT INTO [',
			dest.drawing.Name,
		'] SELECT [', table.columns.join('],['), '] FROM [',
			source.drawing.Name,
		'] WHERE [STATE] = "',
			state,
		'";'
	);
	query.Run();
	var i = 1;
*/
}

function Simplify( table, tolerance /*, toleranceAK*/ ) {
	var fullDrawing = GetDrawing( table.shpNameFull );
	var full = new Drawing( fullDrawing );
	
	var simple = new Drawing( Document.NewDrawing(
		DrawingName(table.shpNameSimple),
		full.drawing.CoordinateSystem,
		false
	) );
	
	ForEach( table.columns, function( name ) {
		CopyColumn( simple.columnSet, full.columnSet, name );
	});
	
	var shpNameTemp = table.shpNameFull + '-Temp';
	var temp = new Drawing( Document.NewDrawing(
		DrawingName(shpNameTemp),
		full.drawing.CoordinateSystem,
		false
	) );
	
/*
	ForEach( table.columns, function( name ) {
		CopyColumn( temp.columnSet, full.columnSet, name );
	});
*/
	
/*
	SelectStateInto( temp, full, '02' );
	full.drawing.Cut( true );
	full = new Drawing( fullDrawing );  // TODO: better way to update this?
	temp.drawing.Paste();
	
	SimplifyPart( temp, simple, table, toleranceAK );
*/
	SimplifyPart( full, simple, table, tolerance );
	
	RemoveDrawing( shpNameTemp );
	
	return simple.drawing;
}

function SimplifyPart( source, simple, table, tolerance ) {
	var geomSetSimple = source.geomSet.NormalizeTopology( tolerance );
	if( source.objectSet.Count != geomSetSimple.Count ) {
		errors.push( S(
			'Object set length mismatch: ', table.shpNameSimple
		) );
		return;
	}
	
	Log( 'Simplifying part of ', table.name );
	
	//Document.BatchUpdates = true;
	
	// I am assuming that source.objectSet and geomSetSimple are in the same order!
	for( var i = 0, n = geomSetSimple.Count;  i < n;  ++i ) {
		if( ( i % 10 ) == 0 ) {
			Log(
				'Copying ', table.name, ': ',
				i, '/', n, ' (', Math.floor( i / n * 100 ), '%)'
			);
		}
		//if( ( i % 1000 ) == 0 ) {
		//	Document.BatchUpdates = false;
		//	Document.BatchUpdates = true;
		//}
		var object = source.objectSet( i );
		var geom = geomSetSimple( i );
		try {
			simple.objectSet.Add( geom );
			var recordFull =
				GetByID( source.recordSet, object.ID );
			var recordSimple =
				GetByID( simple.recordSet, simple.objectSet.LastAdded.ID );
			Document.BatchUpdates = true;
			ForEach( table.columns, function( name ) {
				recordSimple.Data(name) = recordFull.Data(name);
			});
			Document.BatchUpdates = false;
		}
		catch( e ) {
			var record = object.Record;
			var msg = [
				e.name, ' (', e.description, '): ',
				table.shpNameSimple, '[', i, ']\r\n'
			];
			ForEach( table.errcols, function( name ) {
				msg.push( name, "='", record.Data(name), "' " );
			});
			errors.push( msg.join(''), '\r\n' );
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
		ForEach( table.columns, function( name ) {
			recordSimple.Data(name) = recordFull.Data(name);
		});
*/
	}
	
	//Document.BatchUpdates = false;
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

function Log() {
	var now = +new Date;
	var elapsed = now - timeStart;
	var seconds = Math.floor( ( elapsed / 1000 ) % 60 );
	var minutes = Math.floor( elapsed / 1000 / 60 );
	Application.StatusText = S(
		minutes, ':', twoDigits(seconds),
		' ', SA(arguments)
	);
}

function twoDigits( n ) {
	return ( n < 10 ? '0' : '' ) + n;
}

function FSO() {
	return new ActiveXObject( 'Scripting.FileSystemObject' );
}

function S() {
	return Array.prototype.join.call( arguments, '' );
}

function SA( args ) {
	return Array.prototype.join.call( args, '' );
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

function Map( set, callback ) {
	var result = [];
	ForEach( set, function( item ) {
		result.push( item );
	});
	return result;
}
