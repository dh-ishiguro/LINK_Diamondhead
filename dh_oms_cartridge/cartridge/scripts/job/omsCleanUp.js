/**
* Delete backup Directorys.
*
* @module cartridge/scripts/job/omsCleanUp
*/

'use strict';

// import Script;
var omsComm = require('./omsCommonFunctions.js');

// Delete check string
var delCheckString;

/**
 * Clean Up Backup Directory
 *
 * Custom parameters key for job execution
 * @param  args : Array [
 *                  ExportOrdersDirectory       : String,
 *                  ImportOrdersDirectory       : String,
 *                  ExportOrdersBackUpDirectory : String,
 *                  ImportOrdersBackUpDirectory : String,
 *                  RetentionDay                : String
 *				]
 *
 * @return retStatus : dw.system.Status
 */
var omsCleanUpFunction = function(args){
	// Initialization
	let sys    = dw.system;
	let logger = sys.Logger;

	// Clean Up
	let exResult = removeBackupDirectoryFunction(
			args['ExportOrdersDirectory'],
			args['ExportOrdersBackUpDirectory'],
			args['RetentionDay']
	);
	if (!exResult) {
		logger.error('Job step error! Remove Export Order BackUp Directory!');
	}
	let imResult = removeBackupDirectoryFunction(
			args['ImportOrdersDirectory'],
			args['ImportOrdersBackUpDirectory'],
			args['RetentionDay']
	);
	if (!imResult) {
		logger.error('Job step error! Remove Import Order BackUp Directory!');
	}

	// Set result status
	let retStatus = new sys.Status(sys.Status.OK);

	return retStatus;
}

/**
 * Remove Date Directory in Backup Directory Function
 *
 * @param  baseDir      : String
 * @param  backupDir    : String
 * @param  retentionDay : Number
 *
 * @return Boolean
 */
var removeBackupDirectoryFunction = function(baseDir, backupDir, retentionDay) {
	// Initialization
	let ioFile     = dw.io.File;
	let util       = dw.util;
	let crtSiteObj = dw.system.Site.getCurrent();
	let logger     = dw.system.Logger;
	let tergetDir  = ioFile.IMPEX + ioFile.SEPARATOR + baseDir + ioFile.SEPARATOR + crtSiteObj.getID() + ioFile.SEPARATOR + backupDir;

	// Check directory
	let dirObj = new ioFile(tergetDir);
	if (!dirObj.isDirectory()) {
		return true;
	}

	// Make calendar Object
	let calendarObj = new util.Calendar();

	// Set TimeZone
	calendarObj.setTimeZone(crtSiteObj.getTimezone());

	// Make delCheckString
	calendarObj.add(util.Calendar.DATE, Number(retentionDay * -1));
	delCheckString = util.StringUtils.formatCalendar(calendarObj, 'yyyyMMdd');

	// Set return value
	let result = true;

	// Get terget directory list
	let dirList = dirObj.listFiles(dirFilterFunction);
	if (!empty(dirList) && !dirList.empty) {
		for(let i in dirList) {
			let mvResult = omsComm.removeDirectoryFunction(dirList[i].getFullPath());
			if (!mvResult) {
				result = false;
			}
		}
	}
	return result;
}

/**
 * File.listFiles Callback Function
 *
 * @param  dirObj : File
 *
 * @return Boolean
 */
var dirFilterFunction = function(dirObj)
{
	// Check directory object type
	if (!dirObj.isDirectory()) {
		return false;
	}

	// Check delete directory
    let dirName = dirObj.getName();
	if (delCheckString <= dirName) {
		return false;
	}

	return true;
}

/* Exports of the modules */
exports.OmsCleanUpFunction = omsCleanUpFunction;
