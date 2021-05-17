const express = require('express');
const axios = require('axios');
const https = require('https');

const router = express.Router();
const {body: bodyValidator, validationResult} = require('express-validator');
const validators = require('./validators');
const {RequestParserByKey, ResponseParserByKey} = require('./parsers');
const {	
	ApiParams,
	CompanyToCompanyKey,
	ApiPathByKey,
	NonTransientErrorsByKey,
	MAX_RETRIES,
} = require('./consts');

const {
	incReasoneCounter,
	getReasonCountersForId,
} = require('./db.js');


/* GET home page. */
router.get('/', (req, res, next) => res.render('index', { title: 'Express' }));

router.get('/healthcheck', async (req, res, next) => {
  try {
    const mockServerHealthcheckResponse = await axios.get(`${req.configuration.mockServerUrl}/healthcheck`);
    console.log(`Mock server responded to health check with the following response: ${mockServerHealthcheckResponse.data}`);
    
    return res.json({ status: 'OK'})
  }
  catch(err) {
    console.log(err);
    return res.json({ status: 'ERR', message: err.response.statusText})
  }
});

router.get('/api/chargeStatuses', (req, res, next) => {
	try {
		let merchId =  req.headers['merchant-identification'];
		const reasonsCounters = getReasonCountersForId(merchId)
		return res.status(200).json({chargeStatuses: reasonsCounters});
	}
	catch(err) {
	    console.log(err);
	    return res.json({ status: 'Error', message: err})	
	}
});
	

router.post(
	'/api/charge', 
	bodyValidator('fullName').notEmpty().custom(validators.validateFullName),
	bodyValidator('creditCardNumber').notEmpty().custom(validators.validateCreditCardNumber),
	bodyValidator('creditCardCompany').notEmpty().custom(validators.validateCreditCardCompany),
	bodyValidator('cvv').custom(validators.validateCvv),
	bodyValidator('expirationDate').notEmpty().custom(validators.validateExpirationDate),
	bodyValidator('amount').notEmpty().custom(validators.validateAmount),
	async (req, res, next) => {
  try {
	const errors = validationResult(req);

  	if (!errors.isEmpty()) {
      return res.status(400).json({errors: errors.array()}) // BAD_REQUEST
    }

	let merchId =  req.headers['merchant-identification'];
  	if(merchId == ''){
		// it still a valid request but it will registered under unknow  merchant
		merchId = 'unspecified-merchant-id';
	}

  	let i = 0, canRetry = true;
  	let failedReason;

  	while (i < MAX_RETRIES && canRetry){
  		
  		await new Promise((resolve, reject) => {
			setTimeout(() => resolve(), Math.pow(i,2)*1000);
		});
		let promiseResult = await createRequest(req);
	  	let {statusCode, retry, reason} = promiseResult;
	  	failedReason = reason;
	  	canRetry = retry;

	  	if(statusCode == 200){
	    	return res.status(200).json({});
	  	}
	  	if (retry){
	  		i += 1;
		} else {
			incReasoneCounter(merchId, reason)
			return res.status(200).json({error: "Card declined"});
		}
	}
	// either reached MaxRetries or got non Transient error
	// in both case we return 400
	incReasoneCounter(merchId, failedReason)
	return res.status(200).json({error: "Card declined"});
  }
  catch(err) {
  	let errStr = err.toString();
  	incReasoneCounter(merchId, errStr)
    return res.status(400).json({ error: errStr})
  }
});

// this function create http post request
// and warp it with a promise.
// the caller should await until the promise is fullfilled or rejected
// It creates the requests based on COMPANY parameter.
const createRequest = (req) => {
	// get the right API and the relevant params (i.e data)
	const {data, path} =  createRequestDataAndPath(req);
	
	const options = {
	  hostname: 'interview.riskxint.com',
	  path: encodeURI(path),
	  method: 'POST',
	  headers: {
	    'Content-Type': 'application/json',
	    'Content-Length': data.length,
	    'identifier': 'Jameel' // per the task requirements
	  }
	}

	return new Promise((resolve, reject) => {
		const httpReq = https.request(options, res => {
			res.respData = '';
		  	res.on('data', chunk => {
			    res.respData += chunk.toString()
	  		});
	  		const onEnd = () => {
	  			const resolvedData = prepareRespone(res, req);
			  	resolve(resolvedData);
	  		}
	  		res.on('end', onEnd);
		});

		httpReq.on('error', error => {
		  reject(error);
		})

		httpReq.write(data)
		httpReq.end()
	  })
}

// get the right API and the relevant params (i.e data)
const createRequestDataAndPath = (req) => {
	const companyKey = CompanyToCompanyKey[req.body.creditCardCompany]

	// select the right request parser
	const parsers = RequestParserByKey[companyKey];
	let data = {};
	ApiParams.forEach(paramKey => {
		// every time we expand the data we have so far
		data = {...data, ...parsers[paramKey](req.body[paramKey])}
	})
	return {
		data: JSON.stringify(data),
		path: ApiPathByKey[companyKey]
	}
}

const prepareRespone = (res, req) =>{
	const companyKey = CompanyToCompanyKey[req.body.creditCardCompany]
	const parser = ResponseParserByKey()[companyKey];
	return parser(res);
}


module.exports = router;
