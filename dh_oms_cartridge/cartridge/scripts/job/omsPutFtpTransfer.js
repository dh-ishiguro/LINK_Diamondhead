/**
 * Put order XML file to FTP server.
 *
 * @module cartridge/scripts/job/omsPutFtpTransfer
 */

'use strict';

// import Script;
var omsComm = require('./omsCommonFunctions.js');

// Job Custom parameters
var cParam;

/**
 * Description of the function
 *
 * Custom parameters key for job execution
 * @param  args : Array [
 *					ExportSrcDirectory        : String,
 *					ExportOrdersDirectory     : String,
 *					BackUpDirectory           : String,
 *					ExportOrderFileNamePrefix : String
 *				]
 *
 * @return retStatus : dw.system.Status
 */
var omsPutFtpTransferFunction = function(args)
{
	// Get Job Custom parameter
	cParam = args;

	// Move export files to site directory
	moveExportFilesToSiteDirectoryFunction();

	// Upload XML files
	let result = uploadXmlFileFunction();

	// Set result status
	let sys = dw.system;
	let retStatus = new sys.Status(sys.Status.OK);
	if (!result) {
		// Set error message
		retStatus = new sys.Status(
				sys.Status.ERROR,
				"ERROR",
				"Job step error!"
		);
	}
	return retStatus;
}

/**
 * Move export files to site directory
 *
 * @return Boolean
 */
var moveExportFilesToSiteDirectoryFunction = function()
{
	// Initialization
	let ioFile      = dw.io.File;
	let crtSiteObj  = dw.system.Site.getCurrent();
	let logger      = dw.system.Logger;
	let rootDirPath = ioFile.IMPEX + ioFile.SEPARATOR + cParam['ExportSrcDirectory'];
	let baseDirPath = rootDirPath + ioFile.SEPARATOR + cParam['ExportOrdersDirectory'];

	// Get export fileList
	let orgFileList = new ioFile(rootDirPath).listFiles(orgFileFilterFunction);
	if (empty(orgFileList) || orgFileList.empty) {
		logger.info('No export file!');
		return true;
	}

	// Make site directory
	let siteDirPath = baseDirPath + ioFile.SEPARATOR + crtSiteObj.getID();
	omsComm.makeDirectoryFunction(siteDirPath);

	// Move export file to site directory
	for (let i in orgFileList) {
		let mvResult = omsComm.moveFileFunction(orgFileList[i].getFullPath() , siteDirPath + ioFile.SEPARATOR);
		if (!mvResult) {
			logger.error('file move error: {0}', orgFileList[i]);
		}
	}

	// Get fileList in site directory
	let renameFileList = new ioFile(siteDirPath).listFiles(orgFileFilterFunction);
	if (!empty(renameFileList) && !renameFileList.empty) {
		for(let i in renameFileList) {
			// file rename
			let orgFileName = renameFileList[i].getName();
			try {
				let strArray = orgFileName.split("Site_");
				let strRep = strArray[1].replace("_", "");
				let newFileName = cParam['ExportOrderFileNamePrefix'] + strRep.slice(0,14) + ".xml";
				let dstFileObj = new ioFile(siteDirPath + ioFile.SEPARATOR + newFileName);
				renameFileList[i].renameTo(dstFileObj);
			}
			catch (exception) {
				logger.error('file rename error!: {0}. {1}',
						renameFileList[i].getFullPath(),
						exception.message
				);
			}
		}
	}

	return true;
}

/**
 * Upload orders XML files and backup
 *
 * @return retResult : Boolean
 */
var uploadXmlFileFunction = function()
{
	// Initialization
	let ioFile        = dw.io.File;
	let crtSiteObj    = dw.system.Site.getCurrent();
	let logger        = dw.system.Logger;
	let rootDirPath   = ioFile.IMPEX + ioFile.SEPARATOR + cParam['ExportSrcDirectory'];
	let baseDirPath   = rootDirPath + ioFile.SEPARATOR + cParam['ExportOrdersDirectory'];
	let siteDirPath   = baseDirPath + ioFile.SEPARATOR + crtSiteObj.getID();

	// Check job parameterupload directory
	let uploadDir = crtSiteObj.getCustomPreferenceValue('omsUploadDirectory');
	if (empty(uploadDir)) {
		return true;
	}

	// Get files list
	let uploadFileList = new ioFile(siteDirPath).listFiles(uploadFileFilterFunction);
	if (empty(uploadFileList) || uploadFileList.empty) {
		return true;
	}

	// Files list sort
	uploadFileList.sort();

	// New SFTPClient
	let sFtp = new dw.net.SFTPClient();

	// SFTP Set Timeout
	let ftpTimeOut = crtSiteObj.getCustomPreferenceValue('omsSftpTimeOut');
	if (!empty(ftpTimeOut)) {
		sFtp.setTimeout(ftpTimeOut);
	}

	// SFTP Set public host key
	let ftpHtKeyType = crtSiteObj.getCustomPreferenceValue('omsSftpHostKeyType');
	let ftpHtKeyFilePath = crtSiteObj.getCustomPreferenceValue('omsSftpHostKeyFilePath');
	if (!empty(ftpHtKeyType) && !empty(ftpHtKeyFilePath)) {
		let ftpKeyfileObj = new ioFile(ioFile.IMPEX + ioFile.SEPARATOR + ftpHtKeyFilePath);
		if (ftpKeyfileObj.exists()) {
			let ftpKeyfReader = new dw.io.FileReader(ftpKeyfileObj, 'UTF-8');
			let ftpHtKey = ftpKeyfReader.readString();
			sFtp.addKnownHostKey(ftpHtKeyType, ftpHtKey);
		}
	}

	// SFTP Connection
	let ftpHost = crtSiteObj.getCustomPreferenceValue('omsSftpHost');
	let ftpPort = crtSiteObj.getCustomPreferenceValue('omsSftpPort');
	let ftpUser = crtSiteObj.getCustomPreferenceValue('omsSftpUser');
	let ftpPass = crtSiteObj.getCustomPreferenceValue('omsSftpPass');
	try {
		let sFtpResult = sFtp.connect(ftpHost, ftpPort, ftpUser, ftpPass);
		if (!sFtpResult) {
			logger.error('Connect ftp server failed! host:{0}', ftpHost);
			return false;
		}
	}
	catch (exception) {
		logger.error('Ftp server connect parameter error!: {0}',
				exception.message
		);
		return false;
	}

	// Make backup directory
	let datetimeStr = omsComm.getDatetimeStringFunction('yyyyMMdd');
	let bkDateDirPath = siteDirPath + ioFile.SEPARATOR + cParam['BackUpDirectory'] + ioFile.SEPARATOR + datetimeStr;
	omsComm.makeDirectoryFunction(bkDateDirPath);

    // Return value
	let retResult = true;

	// Upload files loop
	for(let i in uploadFileList) {
		// Upload file name
		let fName = uploadFileList[i].getName().replace(".xml", "");
		let upName = uploadDir + ioFile.SEPARATOR + fName;

		// Upload Tmp File
		let upFullPath = upName + '.tmp';
		let putResult = sFtp.putBinary(upFullPath, uploadFileList[i]);
		if (!putResult) {
			logger.error('File upload failed! path:{0}', upFullPath);
			retResult = false;
			break;
		}

		// rename tmp to xml
		let rnResult = sFtp.rename(upFullPath, upName + '.xml');
		if (!rnResult) {
			// delete tmp file
			sFtp.del(upFullPath);
			logger.error('Upload file rename failed! path:{0} -> {1}.xml',
					upFullPath,
					upName
			);
			retResult = false;
			break;
		}

		// move backup directory
		let mvResult = omsComm.moveFileFunction(uploadFileList[i].getFullPath(), bkDateDirPath + ioFile.SEPARATOR);
		if (!mvResult) {
			logger.error('Backup file move error: {0} -> {1}',
					uploadFileList[i].getName(),
					bkDateDirPath + ioFile.SEPARATOR
			);
			retResult = false;
			break;
		}
	}

	// SFTP Disconnection
	sFtp.disconnect();

    return retResult;
}

/**
 * File.listFiles Callback Function
 *
 * @param  fileObj : File
 *
 * @return result : Boolean
 */
var orgFileFilterFunction = function(fileObj)
{
    let site  = dw.system.Site;

	let siteID = site.getCurrent().getID();
	let result = fileFilterFunction(
			fileObj,
			cParam['ExportOrderFileNamePrefix'] + 'Sites-' + siteID + '-Site_[0-9]{8}_[0-9]{9}.xml$'
	);
	return result;
}

/**
 * File.listFiles Callback Function
 *
 * @param  fileObj : File
 *
 * @return result : Boolean
 */
var uploadFileFilterFunction = function(fileObj)
{
	let result = fileFilterFunction(
			fileObj,
			cParam['ExportOrderFileNamePrefix'] + '[0-9]{14}.xml$'
	);
	return result;
}

/**
 * File.listFiles Callback Sub Function
 *
 * @param  fileObj : File
 * @param  filter : String
 *
 * @return Boolean
 */
var fileFilterFunction = function(fileObj, filter)
{
	// Initialization
    let fName = fileObj.getName();

	// Check file object type
	if (fileObj.isDirectory()) {
		return false;
	}

	// Check Filename
	let pattern = new RegExp(filter);
	let matchResult = fName.match(pattern, 'g');
	if (!matchResult){
		return false;
	}
	return true;
}

/* Exports of the modules */
exports.OmsPutFtpTransferFunction = omsPutFtpTransferFunction;
