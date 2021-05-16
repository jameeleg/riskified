
const {	
	CompaniesName,
	CompaniesStatus,
	SupportedCompanies,
	ApiParams,
	CompanyToCompanyKey,
	ApiPathByKey,
	NonTransientErrorsByKey
} = require('./consts');

function validateFullName(fullName){
	// we assume that full name consists of <firstName> <lastName>
	// for example Jameel Egbaria -> fname = Jameel , lname = Egbaria
	// Donald John Trump -> fname = Donald, lname= John Trump


	fullName = sanitizeFullName(fullName);
	if(fullName.length < 3){
		throw new Error('Invalid full name. Short name');		
	}

	// For simplicity, let's assume name contains only a-z/A-Z
	// no numbers and no special charecters
	// let's assume that we don't have ' and - in the any name
	// Mat O'Brian or Donald Jonh-Trump will be treated as invalid 
	// (just for simplicity of the regex expression)

	
	/*
		Taken from stack overflow :) 
		https://stackoverflow.com/questions/11522529/regexp-for-checking-the-full-name/47261181
		* ([\w]{3,}) the first name should contain only letters and of length 3 or more
		* +\s the first name should be followed by a space
		* +([\w\s]{3,})+ the second name should contain only letters of length 3 or more and can be followed by other names or not
		* /i ignores the case of the letters. Can be uppercase or lowercase letters 
	*/
	const fullNameRegex =  /^([\w]{3,})+\s+([\w\s]{3,})+$/i;
	const found = fullName.match(fullNameRegex);
	if(found){
		return true;
	}
	throw new Error('Invalid full name');
}

function sanitizeFullName(fullName) {
	// trim for removing leading spaces
	return fullName.trim();
}


function validateCreditCardNumber(ccnumber) {
	ccnumber = sanitizeCreditCardNumber(ccnumber)
	if(ccnumber.length !== 16 || !Number.parseInt(ccnumber) ){
		throw new Error('Invalid credit card number');	
	}
	return true;	
}

function sanitizeCreditCardNumber(ccnumber) {
	// We want maximes the chances for the caller 
	// to succeeded in calling the API. Users usually  
	// sends every 4 digits separated by a space.
	// The following line removes spaces between numbers.
	// 4580 4580 4580 4580 -> 4580458045804580
	ccnumber = ccnumber.replace(/\s/g, '');
	return ccnumber;	
}




function validateCreditCardCompany(company) {
	const status = SupportedCompanies[company];
	if (status && status === CompaniesStatus.ENABLED) {
		return true;
	}
	throw new Error('Invalid credit card company name');
}

function validateExpirationDate(expDate) {
	const found =  parseExpirationDate(expDate);
	if (!found){
		throw new Error('Invalid expiration Date');
	}
	let[_, month, year] = found;
	month = Number.parseInt(month);
	year = Number.parseInt(year);

	const validToMonth = month + 12*year;
	const d = new Date();
	const currentMonth = d.getMonth() +1; // getMonth returnd 0 - 11
	const currentYear = d.getFullYear() - 2000;
	const monthNow = currentMonth + currentYear*12;

	if(validToMonth < monthNow){
		throw new Error('Invalid expiration Date');
	}
	return true;
}

function parseExpirationDate(expDate){
	const regex = /^(0[1-9]|1[0-2])\/?([0-9]{2})$/;
	return expDate.match(regex);
}

function validateCvv(cvv) {
	if(cvv.length !== 3 || !Number.parseInt(cvv)){
		throw new Error('Invalid cvv number');
	}

	return true;
}

function validateAmount(amount) {
 	// we accept positive and negative amounts
 	// Negative for charge back for example.
	const amountNumber = Number(amount)
	if(amountNumber){
		return true;
	}
	throw new Error('Invalid cvv number');
}

module.exports = {
	validateAmount,
	validateCvv,
	validateExpirationDate,
	validateFullName,
	validateCreditCardCompany,
	validateCreditCardNumber,
	sanitizeCreditCardNumber,
	sanitizeFullName,
	parseExpirationDate,
}