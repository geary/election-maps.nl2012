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
	var tables = [ 'state', 'county' ];
	var resolutions = [ '20m', '5m', '500k' ];
	var tolerances = [ 256, 512, 1024, 2048, 4096, 8192, 16384 ];
//	var tables = [ 'county' ];
//	var resolutions = [ '20m' ];
//	var tolerances = [ 16384 ];
	
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
}

function RemoveDrawing( shpName ) {
	var index = DrawingIndex( shpName );
	if( index >= 0 ) Document.ComponentSet.Remove( index );
}

function ImportShape( shpName ) {
	var imp = Document.NewImport( 'SHP' );
	imp.Import( ShapePath(shpName), PromptNone );
}

function Simplify( shpNameFull, shpNameSimple, tolerance ) {
	var drawingFull = GetDrawing( shpNameFull );
	var objectSetFull = drawingFull.ObjectSet;
	var drawingSimple = Document.NewDrawing(
		DrawingName(shpNameSimple),
		drawingFull.CoordinateSystem,
		false
	);
	var objectSetSimple = drawingSimple.ObjectSet;
	var geomsFull = objectSetFull.GeomSet;
	var geomsSimple = geomsFull.NormalizeTopology( tolerance );
	for( var i = 0, n = geomsSimple.Count;  i < n;  ++i ) {
		var geom = geomsSimple( i );
		try {
			objectSetSimple.Add( geom );
		}
		catch( e ) {
			errors.push( S(
				'Invalid geometry: ', shpNameSimple, '[', i, ']'
			) );
			return null;
		}
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
