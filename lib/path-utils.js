/* global process */



var path = require('path');
var fs = require('fs');

var _sanitizedRegExp = function (strRX) {
  return strRX.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/, "\\$&");
};

var _endsWithSep = RegExp("\\"+path.sep+"$");
var _endsWithoutSep = RegExp("[^\\"+path.sep+"]$");
//var _pathEndsWithSep = RegExp(".+\\"+path.sep+"$");

var _isDir = function (dirPath) {
  try {
    var stats = fs.statSync(dirPath);
    return !stats.isFile();
  } catch (error) {
    return false;
  }
};

var _getMaxLength = function (list) {
  return Math.max.apply(null, list.map(function (elem) {
    return elem.length;
  }));
};

//Wrapping some path functions
module.exports.join = path.join;

module.exports.resolve = function () {
  //This wrapper adds a path.sep at the end of the resolved path is it is a directory
  
  var resolvedPath = path.resolve.apply(path, arguments);
  
  if ( _endsWithoutSep.test(resolvedPath) && _isDir(resolvedPath) ) {
    resolvedPath += path.sep;
  }
  
  return resolvedPath;
};

module.exports.basename = function (strPath) {
  if ( _endsWithoutSep.test(strPath) ) {
    return path.basename.apply(path, arguments);
  }
  return "";
};

module.exports.dirname = function (strPath) {
  //TODO: Let see how it works in windows
  if ( strPath.match(/.+\/$/) ) {
    return strPath.substr(0, strPath.length-1);
  }
  return path.dirname(strPath); 
};

//Methods
module.exports.isDir = _isDir;

module.exports.getMaxLength = _getMaxLength;

module.exports.filterList = function (list, filter) {
  if ( !filter ) {
    return list;
  }
  
  var filterStr = filter.split('').map(function(elem){
    return '.*' + elem.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/, "\\$&");
  }).join('') + '.*';
  
  var regex = RegExp(filterStr, 'i');
  
  return list.filter(function (item) {
    return regex.test(item);
  });
};

module.exports.filterListBash = function (list, filter) {
  if ( !filter ) {
    return list;
  }
  
  var filterStr = '^' + filter.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&") + '.*';
  
  var regex = RegExp(filterStr);
  
  return list.filter(function (item) {
    return regex.test(item);
  });
};

module.exports.getDirContenList = function (dirPath, dirOnly) {
  var absDirPath = path.resolve(dirPath);
  
  return fs.readdirSync(absDirPath).map(
    function (elem) {
      if ( _isDir(path.join(absDirPath, elem)) ) {
        return elem + path.sep;
      }else if ( dirOnly ) {
        return null;
      }
      return elem;
    }
  ).filter(function(elem){
    return !!elem;
  });
};

module.exports.getLines = function (list, rowNumLimit) {
  
  if ( list.length == 0 ) {
    return [];
  }
  
  var maxLength = _getMaxLength(list) + 2; //It is only to add an extra space
  var maxColumns = Math.floor(process.stdout.columns/maxLength); 
  var maxRows = Math.ceil(list.length/maxColumns);
  var linesLength = Math.min(maxRows, 8);
  var lines = new Array(linesLength);
  
  for (var i = 0; i < linesLength; i++) {
    lines[i] = [];
  }

  list.forEach(function (elem, index) {
    if ( index >= maxColumns*linesLength) {
      return false;
    }
    lines[index % linesLength].push(elem + Array(maxLength - elem.length).join(' '));
  });
  
  var result = lines.map(function (elem) {
    return elem.join(' ');
  });
  
  //Prevent to show more than 8 rows
  if ( maxRows > 8 ) {
    result.push('Too many results, please add some chars to filter the results');
  }
  
  return result;
};

/**
 * This function was taken from: 
 * http://stackoverflow.com/questions/1916218/find-the-longest-common-starting-substring-in-a-set-of-strings
 */

module.exports.sharedStart = function (array) {
    var A= array.concat().sort(), 
    a1= A[0], a2= A[A.length-1], L= a1.length, i= 0;
    while(i<L && a1.charAt(i)=== a2.charAt(i)) i++;
    return a1.substring(0, i);
};
