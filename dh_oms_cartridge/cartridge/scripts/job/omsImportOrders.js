/**
* Reads and analyzes the order data of the XML file,
* Change the status of SFCC order data.
*
* @module cartridge/scripts/job/omsImportOrders
*/

'use strict';

// import Script;
var omsComm = require('./omsCommonFunctions.js');

// Job Custom parameters
var cParam;

// Order commt flag
var ordrCommitFlg;

/**
 * Description of the function
 *
 * Custom parameters key for job execution
 * @param  args : Array [
 *                  importOrdersDirectory     : String,
 *                  ImportOrderFileNamePrefix : String,
 *                  BackUpDirectory           : String
 *				]
 *
 * @return retStatus : dw.system.Status
 */
var omsImportOrdersFunction = function(args)
{
	// Get Job Custom parameter
	cParam = args;

	// Import XML files
	let result = importOrdersFunction();

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
 * Import XML Files Function
 *
 * @return Boolean
 */
var importOrdersFunction = function()
{
	// Initialization
	let ioFile      = dw.io.File;
	let crtSiteObj  = dw.system.Site.getCurrent();
	let txn         = dw.system.Transaction;
	let logger      = dw.system.Logger;
	let baseDirPath = ioFile.IMPEX + ioFile.SEPARATOR + cParam['ImportOrdersDirectory'];
	let siteDirPath = baseDirPath + ioFile.SEPARATOR + crtSiteObj.getID();

	// Get Files List
	let importFileList = new ioFile(siteDirPath).listFiles(fileFilterFunction);
	if (empty(importFileList) || importFileList.empty) {
		return true;
	}

	// Files list sort
	importFileList.sort();

	// Make backup directory
	let datetimeStr = omsComm.getDatetimeStringFunction('yyyyMMdd');
	let bkDateDirPath = siteDirPath + ioFile.SEPARATOR + cParam['BackUpDirectory'] + ioFile.SEPARATOR + datetimeStr;
	omsComm.makeDirectoryFunction(bkDateDirPath);

	// Import extraction
	for(let i in importFileList) {
		// Set order commt flag
		ordrCommitFlg = false;

		// Start transaction
		txn.begin();

		// Set Order Status
		let result = setOrderStatusFunction(importFileList[i]);
		if (result) {
			// File move backup directory
			let mvResult = omsComm.moveFileFunction(importFileList[i].getFullPath(), bkDateDirPath + ioFile.SEPARATOR);
			if (!mvResult) {
				if (ordrCommitFlg) {
					// rollback transaction
					txn.rollback();

					// Set order commit flag
					ordrCommitFlg = false;
				}

				logger.error('Backup file move error: {0} -> {1}',
						importFileList[i].getName(),
						bkDateDirPath + ioFile.SEPARATOR
				);
				continue;
			}
		}
		else {
			if (ordrCommitFlg) {
				// rollback transaction
				txn.rollback();

				// Set order commit flag
				ordrCommitFlg = false;
			}
		}

		// commit transaction
		if (ordrCommitFlg) {
			txn.commit();
		}
	}

	return true;
}

/**
 * File.listFiles Callback Function
 *
 * @param  fileObj : File
 *
 * @return Boolean
 */
var fileFilterFunction = function(fileObj)
{
	// Initialization
    let fName = fileObj.getName();

	// Check file object type
	if (fileObj.isDirectory()) {
		return false;
	}

	// Check Filename
	let ptnStr = '^' + cParam['ImportOrderFileNamePrefix'] + '[0-9-_]{19}.xml$'
	let pattern = new RegExp(ptnStr);
	let matchResult = fName.match(pattern, 'g');
	if (!matchResult) {
		return false;
	}
	return true;
}

/**
 * Set Order Status Function
 *
 * @param  fileObj : File
 *
 * @return Boolean
 */
var setOrderStatusFunction = function(fileObj)
{
	// Initialization
	let xmlStreamConstants = dw.io.XMLStreamConstants;
	let orderMgr           = dw.order.OrderMgr;
	let logger             = dw.system.Logger;

	// XML file read
	let fReader = new dw.io.FileReader(fileObj, 'UTF-8');
	let xmlStreamReader = new dw.io.XMLStreamReader(fReader);

	// Search terget element
	while(xmlStreamReader.hasNext()) {
		if (xmlStreamReader.next() == xmlStreamConstants.START_ELEMENT) {
			let elementName = xmlStreamReader.getLocalName();
			if (elementName == 'order') {
				// Get XML string object
				let xmlStr = xmlStreamReader.readXMLObject();

				// Make XML object
				let xmlObj = new XML(xmlStr);

				// Get order-no
				let orderNumber = xmlObj.attribute('order-no').toString();
				if (orderNumber) {
					// Get order object
					let orderObj = orderMgr.searchOrder('orderNo = {0}', orderNumber);
					if (!orderObj) {
						logger.error('Import Error! No store side order number {0}! file:{1} order-no:{2}',
								orderNumber,
								fileObj.getName(),
								orderNumber
						);
					}
					else {
						// Get namespace
						let xmlNs = xmlObj.namespace();

						// Get status elements
						let statusElementGroupQName = new QName(xmlNs, 'status');
						let statusXML = xmlObj.child(statusElementGroupQName);
						if (statusXML) {
							// Get store order status
							let odrOrderStatusVal = orderObj.getStatus();
							let odrShippingStatusVal = orderObj.getShippingStatus();
							let odrConfirmationStatusVal = orderObj.getConfirmationStatus();
							let odrPaymentStatusVal = orderObj.getPaymentStatus();

							// Get xml status
							let xmlOrderStatusVal = getXmlStatusFunction(statusXML, xmlNs, 'order-status', 'ORDER_STATUS');
							let xmlShippingStatusVal = getXmlStatusFunction(statusXML, xmlNs, 'shipping-status', 'SHIPPING_STATUS');
							let xmlConfirmationStatusVal = getXmlStatusFunction(statusXML, xmlNs, 'confirmation-status', 'CONFIRMATION_STATUS');
							let xmlPaymentStatusVal = getXmlStatusFunction(statusXML, xmlNs, 'payment-status', 'PAYMENT_STATUS');

							try {
								// Set store order status and order commit flag
								if (odrOrderStatusVal != xmlOrderStatusVal) {
									orderObj.setStatus(xmlOrderStatusVal);
									ordrCommitFlg = true;
								}
								if (odrShippingStatusVal != xmlShippingStatusVal) {
									orderObj.setShippingStatus(xmlShippingStatusVal);
									ordrCommitFlg = true;
								}
								if (odrConfirmationStatusVal != xmlConfirmationStatusVal) {
									orderObj.setConfirmationStatus(xmlConfirmationStatusVal);
									ordrCommitFlg = true;
								}
								if (odrPaymentStatusVal != xmlPaymentStatusVal) {
									orderObj.setPaymentStatus(xmlPaymentStatusVal);
									ordrCommitFlg = true;
								}
							}
							catch(exception) {
							    // close use object
							    xmlStreamReader.close();
							    fReader.close();

								// Write Error Log
								logger.error('Change order status Error! order-no:{0}. {1}',
										orderNumber,
										exception.message
								);
								return false;
							}
						}
					}
				}
			}
		}
	}

    // close use object
    xmlStreamReader.close();
    fReader.close();

	return true;
}

/**
 * Get value in attribute Function
 *
 * @param  statusXMLObject : XML Object
 * @param  namespace : String
 * @param  elementName : String
 * @param  statusType : String
 *
 * @return Boolean
 */
var getXmlStatusFunction = function(statusXMLObject, namespace, elementName, statusType)
{
	let qName          = new QName(namespace, elementName);
	let orderStatusStr = statusXMLObject.child(qName).toString();
	let returnValue    = (new Function('return dw.order.Order.' + statusType + '_' + orderStatusStr.replace('_', '')))();

	return returnValue;
}

/* Exports of the modules */
exports.OmsImportOrdersFunction = omsImportOrdersFunction;

