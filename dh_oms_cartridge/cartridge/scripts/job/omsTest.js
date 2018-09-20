/**
* Description of the module and the logic it provides
*
* @module cartridge/scripts/job/omsTest
*/

'use strict';

//import Script;
var omsComm = require('./omsCommonFunctions.js');

// HINT: do not put all require statements at the top of the file
// unless you really need them for all functions

/**
* Description of the function
*
* @return {String} The string 'myFunction'
*/

importPackage(dw.io);
importPackage(dw.system);

var myFunction = function(){
	let File = dw.io.File;
	let logger = dw.system.Logger;
	let siteID = dw.system.Site.getCurrent().getID();

	// 試験前ディレクトリ削除
	//let srcDir = File.IMPEX + File.SEPARATOR + "src/ExportOrders"
	//removeBackUp(srcDir + File.SEPARATOR + siteID + "/BackUp/20180821");
	//removeBackUp(srcDir + File.SEPARATOR + siteID + "/BackUp");
	//removeBackUp(srcDir + File.SEPARATOR + siteID);
	//removeBackUp(srcDir);


	// バグディレクトリ削除
	//removeBackUp(File.IMPEX + File.SEPARATOR + "src/ImportOrders/OMS_DEV01/OMS_DEV01/BackUp");
	//removeBackUp(File.IMPEX + File.SEPARATOR + "src/ImportOrders/OMS_DEV01/OMS_DEV01");
	//omsComm.removeDirectoryFunction(File.IMPEX + File.SEPARATOR + "src/ImportOrders/OMS_DEV01/OMS_DEV01");

	//omsComm.removeFileFunction(File.IMPEX + File.SEPARATOR + "src/ImportOrders/OMS_DEV01/OrderHistory_2018-01-01_00-00-01.xml");

	// テスト用データをsiteのディレクトリ入れる
	//omsComm.removeFileFunction(File.IMPEX + File.SEPARATOR + "src/ImportOrders/OMS_DEV01/OrderHistory_2018-08-02_00-00-01.xml");
	//omsComm.removeFileFunction(File.IMPEX + File.SEPARATOR + "src/ImportOrders/OMS_DEV01/OrderHistory_2018-08-02_00-00-02.xml");
	//omsComm.removeFileFunction(File.IMPEX + File.SEPARATOR + "src/ImportOrders/OMS_DEV01/OrderHistory_2018-08-02_00-00-03.xml");
	//omsComm.removeFileFunction(File.IMPEX + File.SEPARATOR + "src/ImportOrders/OMS_DEV01/OrderHistory_2018-08-02_00-00-04.xml");
	//omsComm.makeDirectoryFunction(File.IMPEX + File.SEPARATOR + "src/ImportOrders/OMS_DEV01");
	//copyTestSiteDirectory("src/order");

	// テスト用ファイル単体をsiteのディレクトリ入れる
	//omsComm.copyFileFunction(
	//		File.IMPEX + File.SEPARATOR + "src/order/OrderHistory_2018-08-02_00-00-01.xml",
	//		File.IMPEX + File.SEPARATOR + "src/ImportOrders/OMS_DEV01/OrderHistory_2018-08-02_00-00-01.xml"
	//);

	// テスト用ファイル単体をsiteディレクトリから削除
	//omsComm.removeFileFunction(File.IMPEX + File.SEPARATOR + "src/ImportOrders/OMS_DEV01/OrderHistory_2018-08-02_00-00-20.xml");

	// テスト用バックアップディレクトリを作る
	//removeBackUp(File.IMPEX + File.SEPARATOR + "src/ExportOrders/" + siteID + File.SEPARATOR + "BackUp");
	//removeBackUp(File.IMPEX + File.SEPARATOR + "src/ImportOrders/" + siteID + File.SEPARATOR + "BackUp");
	//makeTestBackUpDirectory("src/order");

	removeBackUp(File.IMPEX + File.SEPARATOR + "src/ExportOrders/" + siteID + File.SEPARATOR + "BackUp");
	removeBackUp(File.IMPEX + File.SEPARATOR + "src/ExportOrders/" + siteID);
	removeBackUp(File.IMPEX + File.SEPARATOR + "src/ExportOrders");
	removeBackUp(File.IMPEX + File.SEPARATOR + "src/ImportOrders/" + siteID + File.SEPARATOR + "BackUp");
	removeBackUp(File.IMPEX + File.SEPARATOR + "src/ImportOrders/" + siteID);
	removeBackUp(File.IMPEX + File.SEPARATOR + "src/ImportOrders");

	let retStatus = new Status(Status.OK);
	return retStatus;
}
/*
var rootRemovefileFunction = function() {
	let ioFile        = dw.io.File;
	let logger        = dw.system.Logger;
	let rootDirectory = ioFile.IMPEX + ioFile.SEPARATOR + 'src';

	// Get root file List
	let fileList = new ioFile(rootDirectory).listFiles(fileFilterFunction);
	if(fileList.empty) {
		return true;
	}
	for(let i in fileList) {
		fileList[i].remove();
	}
	return true;
}
*/

/**
 * File.listFiles Callback Function
 *
 * @param  fileObj : File
 *
 * @return Boolean
 */
/*
var fileFilterFunction = function(fileObj) {
	// Initialization
    let site  = dw.system.Site;
    let fName = fileObj.getName();

	// Check file object type
	if(fileObj.isDirectory()) {
		return false;
	}
	return true;
}
*/
var copyTestSiteDirectory = function(srcDirName) {
	let siteID = dw.system.Site.getCurrent().getID();
	let srcDir = File.IMPEX + File.SEPARATOR + srcDirName;
	let dstDir = File.IMPEX + File.SEPARATOR + "src/ImportOrders/" + siteID;
    let fileNames = new Array(
    	"OrderHistory_2018-08-02_00-00-01.xml",
    	"OrderHistory_2018-08-02_00-00-02.xml",
    	"OrderHistory_2018-08-02_00-00-03.xml",
    	"OrderHistory_2018-08-02_00-00-04.xml",
    	"OrderHistory_2018-08-02_00-00-22.xml",
    	"OrderHistory_2018-08-02_00-00-23.xml"
    );
	for (let i in fileNames) {
		let srcPath = srcDir + File.SEPARATOR + fileNames[i];
		let dstPath = dstDir + File.SEPARATOR + fileNames[i];
		omsComm.copyFileFunction(srcPath, dstPath);
	}
	return true;
}

var removeBackUp = function(backupDir) {
	let ioFile      = dw.io.File;

	let dirObj = new ioFile(backupDir);
	if (!dirObj.isDirectory()) {
		return false;
	}

	let fileList = dirObj.listFiles();
	if (!fileList.empty) {
		for(let i in fileList) {
			omsComm.removeDirectoryFunction(fileList[i].getFullPath());
		}
	}

	dirObj.remove();

	return true;
}

var makeTestBackUpDirectory = function(srcDirName) {
	let crtSiteObj = dw.system.Site.getCurrent();
	let siteID     = crtSiteObj.getID();
	let srcDir     = File.IMPEX + File.SEPARATOR + srcDirName;
    let fileNames = new Array(
    	"OrderHistory_2018-08-02_00-00-01.xml",
    	"OrderHistory_2018-08-02_00-00-02.xml",
    	"OrderHistory_2018-08-02_00-00-03.xml",
    	"OrderHistory_2018-08-02_00-00-04.xml"
    );
	let srcPath;
	let dstPath;
    let tergetDir;
    let baseDir;

    baseDir =  File.IMPEX + File.SEPARATOR + "src/ExportOrders/" + siteID + File.SEPARATOR + "BackUp";
    // 本日
    dstDir = baseDir + File.SEPARATOR + getDate(0);
    omsComm.makeDirectoryFunction(dstDir);
    srcPath = srcDir + File.SEPARATOR + fileNames[0];
	dstPath = dstDir + File.SEPARATOR + fileNames[0];
	omsComm.copyFileFunction(srcPath, dstPath);
	// 前日
	dstDir = baseDir + File.SEPARATOR + getDate(-1);
    omsComm.makeDirectoryFunction(dstDir);
    srcPath = srcDir + File.SEPARATOR + fileNames[0];
	dstPath = dstDir + File.SEPARATOR + fileNames[0];
	omsComm.copyFileFunction(srcPath, dstPath);
    srcPath = srcDir + File.SEPARATOR + fileNames[1];
	dstPath = dstDir + File.SEPARATOR + fileNames[1];
	omsComm.copyFileFunction(srcPath, dstPath);
	// 前々日
	dstDir = baseDir + File.SEPARATOR + getDate(-2);
    omsComm.makeDirectoryFunction(dstDir);
    // 3日前
    // 4日前
    dstDir = baseDir + File.SEPARATOR + getDate(-4);
    omsComm.makeDirectoryFunction(dstDir);
    srcPath = srcDir + File.SEPARATOR + fileNames[0];
	dstPath = dstDir + File.SEPARATOR + fileNames[0];
	omsComm.copyFileFunction(srcPath, dstPath);
    srcPath = srcDir + File.SEPARATOR + fileNames[1];
	dstPath = dstDir + File.SEPARATOR + fileNames[1];
	omsComm.copyFileFunction(srcPath, dstPath);
    srcPath = srcDir + File.SEPARATOR + fileNames[2];
	dstPath = dstDir + File.SEPARATOR + fileNames[2];
	omsComm.copyFileFunction(srcPath, dstPath);

    baseDir =  File.IMPEX + File.SEPARATOR + "src/ImportOrders/" + siteID + File.SEPARATOR + "BackUp";
    // 本日
    dstDir = baseDir + File.SEPARATOR + getDate(0);
    omsComm.makeDirectoryFunction(dstDir);
    srcPath = srcDir + File.SEPARATOR + fileNames[0];
	dstPath = dstDir + File.SEPARATOR + fileNames[0];
	omsComm.copyFileFunction(srcPath, dstPath);
	// 前々日
	dstDir = baseDir + File.SEPARATOR + getDate(-2);
    omsComm.makeDirectoryFunction(dstDir);
    // 3日前
    dstDir = baseDir + File.SEPARATOR + getDate(-3);
    omsComm.makeDirectoryFunction(dstDir);
    srcPath = srcDir + File.SEPARATOR + fileNames[0];
	dstPath = dstDir + File.SEPARATOR + fileNames[0];
	omsComm.copyFileFunction(srcPath, dstPath);
    // 4日前
    dstDir = baseDir + File.SEPARATOR + getDate(-4);
    omsComm.makeDirectoryFunction(dstDir);
    srcPath = srcDir + File.SEPARATOR + fileNames[0];
	dstPath = dstDir + File.SEPARATOR + fileNames[0];
	omsComm.copyFileFunction(srcPath, dstPath);
    srcPath = srcDir + File.SEPARATOR + fileNames[1];
	dstPath = dstDir + File.SEPARATOR + fileNames[1];
	omsComm.copyFileFunction(srcPath, dstPath);
    srcPath = srcDir + File.SEPARATOR + fileNames[2];
	dstPath = dstDir + File.SEPARATOR + fileNames[2];
	omsComm.copyFileFunction(srcPath, dstPath);

}

var getDate = function(num) {
	let util       = dw.util;
	let crtSiteObj = dw.system.Site.getCurrent();

	let calendarObj = new util.Calendar();
	calendarObj.setTimeZone(crtSiteObj.getTimezone());
	calendarObj.add(util.Calendar.DATE, num);
	result  = util.StringUtils.formatCalendar(calendarObj, 'yyyyMMdd');
	return result
}

var ftpConnectionTestFunction = function()
{
	// Initialization
	let sys         = dw.system;

	// return object
	let retStatus   = new sys.Status(sys.Status.OK);

	// ftp connection
	let result = ftpConnectionSub();
	if (!result) {
		retStatus = new sys.Status(sys.Status.ERROR);
	}

	return retStatus;

}

var ftpConnectionSub = function()
{
	// Initialization
	let sys         = dw.system;
	let ioFile      = dw.io.File;
	let crtSiteObj  = sys.Site.getCurrent();
	let logger      = sys.Logger;

	// Check job parameter download directory
	let dwloadDir = crtSiteObj.getCustomPreferenceValue('omsDownloadDirectory');
	if (empty(dwloadDir)) {
		logger.error('No parameter! Download Directory!');
		return false;
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
		let ftpKeyfileObj = new ioFile(File.IMPEX + ioFile.SEPARATOR + ftpHtKeyFilePath);
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
			logger.error('Connect ftp server failed!');
			return false;
		}
	}
	catch (exception) {
		logger.error('Ftp server connect parameter error!');
		return false;
	}

	// Get Ftp Files list
	let dwPath = dwloadDir + ioFile.SEPARATOR;
	let dwloadFileList = sFtp.list(dwPath);
	if (!empty(dwloadFileList)) {
		logger.info('Download Files...');
		for(fileInfo in dwloadFileList) {
			// Get Filename
		    let fName  = dwloadFileList.getName();
			logger.info('File: {0}', fName);
		}
	}

	// SFTP Disconnection
	sFtp.disconnect();

	return true;
}

exports.MyFunction = myFunction;
exports.FtpConnectionTestFunction = ftpConnectionTestFunction;

