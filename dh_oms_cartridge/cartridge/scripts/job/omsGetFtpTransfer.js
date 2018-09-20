/**
* Get order XML file from FTP server.
*
* @module cartridge/scripts/job/omsGetFtpTransfer
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
 *                  ImportOrdersDirectory     : String,
 *                  ImportOrderFileNamePrefix : String
 *				]
 *
 * @return retStatus : dw.system.Status
 */
var omsGetFtpTransferFunction = function(args)
{
	// Get Job Custom parameter
	cParam = args;

	// Download XML files
	let result = downloadXmlFileFunction();

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
 * Download orders XML files
 *
 * @return Boolean
 */
var downloadXmlFileFunction = function()
{
	// Initialization
	let ioFile      = dw.io.File;
	let crtSiteObj  = dw.system.Site.getCurrent();
	let logger      = dw.system.Logger;
	let baseDirPath = ioFile.IMPEX + ioFile.SEPARATOR + cParam['ImportOrdersDirectory'];
	let siteDirPath = baseDirPath + ioFile.SEPARATOR + crtSiteObj.getID();

	// Check job parameter download directory
	let dwloadDir = crtSiteObj.getCustomPreferenceValue('omsDownloadDirectory');
	if (empty(dwloadDir)) {
		return true;
	}

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

	// Get Ftp Files list
	let dwPath = dwloadDir + ioFile.SEPARATOR;
	let dwloadFileList = sFtp.list(dwPath);
	if (!empty(dwloadFileList)) {

		// Make site directory
		omsComm.makeDirectoryFunction(siteDirPath);

		for(fileInfo in dwloadFileList) {
			// Get Filename
		    let fName  = dwloadFileList.getName();

			// Check filename
			let ptnStr = '^' + cParam['ImportOrderFileNamePrefix'] + '[0-9]{14}.xml$'
			let pattern = new RegExp(ptnStr);
			let matchResult = fName.match(pattern, 'g');
			if (matchResult) {
				// Ftp file Path
				let dwFilePath = dwPath +  fName;

				// Local File path
				let imFileName = siteDirPath + ioFile.SEPARATOR + fName;

				// Download
				let fileObj = new ioFile(imFileName);
				let dwResult = sFtp.getBinary(dwFilePath, fileObj);
				if (!dwResult) {
					logger.error('File download failed! Ftp Path:{0}', dwFilePath);
					continue;
				}

				// Ftp File Remove
				let delResult= sFtp.del(dwFilePath);
				if (!delResult) {
					logger.error('Remove sftp server file failed! Path:{0}', dwFilePath);
					continue;
				}
			}
		}
	}

	// SFTP Disconnection
	sFtp.disconnect();

	return true;
}

/* Exports of the modules */
exports.OmsGetFtpTransferFunction = omsGetFtpTransferFunction;
