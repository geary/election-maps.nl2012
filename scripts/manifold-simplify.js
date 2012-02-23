var errors = [];

function Main() {
	Clean();
	ImportSimplifyExport();
	if( errors.length ) {
		Application.MessageBox( errors.join('\n'), 'Simplify' );
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
	ForAllShapes( function( shpNameFull, shpNameSimple, tolerance ) {
		ImportShape( shpNameFull );
		var drawingSimple = Simplify( shpNameFull, shpNameSimple, tolerance );
		if( drawingSimple ) ExportShape( drawingSimple, shpNameSimple );

		RemoveDrawing( shpNameFull );
		RemoveDrawing( shpNameSimple );
	});
}

function ForAllShapes( callback ) {
	var tables = [
		/*'state',*/ 'state02', 'state15', 'state99'
//		,
//		/*'county',*/ 'county02', 'county15', 'county99'
	];
//	var resolutions = [ '20m', '5m', '500k' ];
	var tolerances = [ 256, 512, 1024, 2048, 4096, 8192, 16384, 32768, 65536 ];
//	var tables = [ 'state02'/*, 'state15', 'state99'*/ ];
	var resolutions = [ '20m' ];
//	var tolerances = [ 32768, 65536, 131072, 262144 ];
//	var tolerances = [ 4096, 8192, 16384, 32768, 65536 ];
//	var tolerances = [ 4096 ];
	
/*
	for( var table, iTable = -1;  table = tables[++iTable]; ) {
		for( var res, iRes = -1;  res = resolutions[++iRes]; ) {
			var shpNameBase = S( 'us2012-', table, '-', res, '-' );
			var shpNameFull = S( shpNameBase, 'full' );
			for( var tol, iTol = -1;  tol = tolerances[++iTol]; ) {
				var shpNameSimple = S( shpNameBase, tol );
				callback( shpNameFull, shpNameSimple, tol );
			}
		}
	}
*/

	ForEach( tables, function( table ) {
		ForEach( resolutions, function( res ) {
			var shpNameBase = S( 'us2012-', table, '-', res, '-' );
			var shpNameFull = S( shpNameBase, 'full' );
			ForEach( tolerances, function( tol ) {
				var shpNameSimple = S( shpNameBase, tol );
				callback( shpNameFull, shpNameSimple, tol );
			});
		});
	});
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

function Simplify( shpNameFull, shpNameSimple, tolerance ) {
	var colNames = 'GEO_ID,STATE,NAME,LSAD,CENSUSAREA,FULL_GEOM'.split(',');

	var drawingFull = GetDrawing( shpNameFull );
	var objectSetFull = drawingFull.ObjectSet;
	var tableFull = drawingFull.OwnedTable;
	var columnSetFull = tableFull.ColumnSet;
	var recordSetFull = tableFull.RecordSet;
	var geomSetFull = objectSetFull.GeomSet;

	var drawingSimple = Document.NewDrawing(
		DrawingName(shpNameSimple),
		drawingFull.CoordinateSystem,
		false
	);
	var objectSetSimple = drawingSimple.ObjectSet;
	var tableSimple = drawingSimple.OwnedTable;
	var columnSetSimple = tableSimple.ColumnSet;
	var recordSetSimple = tableSimple.RecordSet;
	var geomSetSimple = geomSetFull.NormalizeTopology( tolerance );
	
	ForEach( colNames, function( name ) {
		CopyColumn( columnSetSimple, columnSetFull, name );
	});
	
	if( objectSetFull.Count != geomSetSimple.Count ) {
		errors.push( S(
			'Object set length mismatch: ', shpNameSimple
		) );
		return null;
	}

	// I am assuming that objectSetFull and geomSetSimple are in the same order!
	for( var i = 0, n = geomSetSimple.Count;  i < n;  ++i ) {
		var object = objectSetFull( i );
		var geom = geomSetSimple( i );
		try {
			objectSetSimple.Add( geom );
		}
		catch( e ) {
			errors.push( S(
				e.name, ' (', e.description, '): ', shpNameSimple, '[', i, ']'
			) );
			return null;
		}
		
		var recordFull =
			GetByID( recordSetFull, object.ID );
		var recordSimple =
			GetByID( recordSetSimple, objectSetSimple.LastAdded.ID );
		ForEach( colNames, function( name ) {
			recordSimple.Data(name) = recordFull.Data(name);
		});
	}

	return drawingSimple;
}

function ExportShape( drawing, shpNameExport ) {
	var exp = Document.NewExport( 'SHP' );
	var folder = ShapeFolder(shpNameExport), path = ShapePath(shpNameExport);
	DeleteFolder( folder );
	CreateFolder( folder );
	exp.Export( drawing, path, PromptNone );
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
