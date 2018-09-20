/**
* OMS Common Functions
*
* @module cartridge/scripts/job/omsCommonFunctions
*/

'use strict';

/**
 * Make Directory Function
 *
 * @param  dirPath : String
 *
 * @return Boolean
 */
var makeDirectoryFunction = function(dirPath)
{
	// Initialization
	let ioFile      = dw.io.File;
	let logger      = dw.system.Logger;

	// Check directory
	let dirObj = new ioFile(dirPath);
	if (!dirObj.exists()) {
		// Make directory
		let result = dirObj.mkdirs();
		if (!result) {
			logger.error('Make directory failed! path:{0}', dirPath);
			return false;
		}
	}
	return true;
}

/**
 * Get Datetime String Function
 *
 * @param  fmt         : String
 *
 * @return returnValue : String
 */
var getDatetimeStringFunction = function(fmt)
{
	// Initialization
	let util        = dw.util;
	let nowCalendar = new util.Calendar();
	let pSite       = dw.system.Site.getCurrent();

	// Set TimeZone
	nowCalendar.setTimeZone(pSite.getTimezone());

	// Get Now Date String
	let returnValue = util.StringUtils.formatCalendar(nowCalendar, fmt);

	return returnValue;
}

/**
 * Move File Function
 *
 * @param  srcFileObj   : File
 * @param  dstDirectory : String
 *
 * @return Boolean
 */
var moveFileFunction = function(srcFilePath, dstDirectory)
{
	// Initialization
	let ioFile = dw.io.File;
	let logger = dw.system.Logger;

	// Make destination file object
	let srcFileObj = new ioFile(srcFilePath);
	if (!srcFileObj.exists()) {
		return false;
	}

	// Make destination file object
	let dstFileObj = new ioFile(dstDirectory + ioFile.SEPARATOR + srcFileObj.getName());

	// Delete same name
	if (dstFileObj.exists()) {
		dstFileObj.remove();
	}

	// Move file
	let mvResult = srcFileObj.renameTo(dstFileObj);
	if (!mvResult) {
		logger.error('File Move failed! src:{0} dst:{1}',
				srcFileObj.getFullPath(),
				dstFileObj.getFullPath()
		);
		return false;
	}

	return true;
}

/**
 * Remove Directory Function
 *
 * @param  dirPath : String
 *
 * @return Boolean
 */
var removeDirectoryFunction = function(dirPath)
{
	// Initialization
	let ioFile = dw.io.File;
	let logger = dw.system.Logger;

	// Check directory
	let dirObj = new ioFile(dirPath);
	if (!dirObj.isDirectory()) {
		return false;
	}

	// Get file list
	let fileList = dirObj.listFiles();
	if (!empty(fileList) && !fileList.empty) {
		for(let i in fileList) {
			// Remove file
			let fResult = fileList[i].remove();
			if (!fResult) {
				logger.error('Remove file failed! path:{0}',
						fileList[i].getFullPath()
				);
				return false;
			}
		}
	}

	// Remove directory
	let dResult = dirObj.remove();
	if (!dResult) {
		logger.error('Remove directory failed! path:{0}', dirPath);
		return false;
	}
	return true;
}

/**
 * Remove File Function
 *
 * @param  filePath : String
 *
 * @return returnValue : Boolean
 */
var removeFileFunction = function(filePath){
	// Initialization
	let ioFile = dw.io.File;

	// Check directory
	let fileObj = new ioFile(filePath);
	if (fileObj.isDirectory()) {
		return false;
	}
	// Remove file
	let returnValue = fileObj.remove();

	return returnValue;
}

/**
 * Copy File Function
 *
 * @param  srcPath : String
 * @param  dstPath : String
 *
 * @return Boolean
 */
var copyFileFunction = function(srcPath, dstPath){
	// Initialization
	let ioFile = dw.io.File;
	let logger = dw.system.Logger;

	// Make sorce file object
	let srcFileObj = new ioFile(srcPath);
	if (srcFileObj.exists()) {

		// Make destination file object
		let dstFileObj = new ioFile(dstPath);
		if (dstFileObj.exists()) {
			// Delete destination file
			dstFileObj.remove();
		}

		// Copy file
		try {
			srcFileObj.copyTo(dstFileObj);
			return true;
		}
		catch(exception) {
			logger.error('File Copy failed! path:{0} -> {1}. {2}',
					srcPath,
					dstPath,
					exception.message
			);
			return false;
		}
	}

	return false;
}

/* Exports of the modules */
exports.makeDirectoryFunction = makeDirectoryFunction;
exports.getDatetimeStringFunction = getDatetimeStringFunction;
exports.moveFileFunction = moveFileFunction;
exports.removeDirectoryFunction = removeDirectoryFunction;
exports.removeFileFunction = removeFileFunction;
exports.copyFileFunction = copyFileFunction;
