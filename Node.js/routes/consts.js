const CompaniesName = {
	VISA: "visa",
	MASTERCARD: "mastercard",
	AMERICANX: "americanexpress",
}
const CompaniesStatus = {
	ENABLED: "enabled",
	DISABLED: "disabled",
	EXP: "expermental",
}

const SupportedCompanies = {
	[CompaniesName.VISA]: CompaniesStatus.ENABLED,
	[CompaniesName.MASTERCARD]: CompaniesStatus.ENABLED,
	[CompaniesName.AMERICANX]: CompaniesStatus.DISABLED,
}

const ApiParams = [
	'fullName',
	'creditCardNumber',
	'expirationDate',
	'cvv',
	'amount',
]

// we want to avoid making our internal implementation
// depends directly on the user params.
// Instead, we use mapping. This adds more safety.
const CompanyToCompanyKey = {
	[CompaniesName.VISA]: 'visaKey',
	[CompaniesName.MASTERCARD]: 'mastercardKey',
};

const ApiPathByKey = {
	visaKey: '/visa/api/chargeCard‌',
	mastercardKey: '/mastercard/capture_card',
}

// non transient errors that won't trigger a retry
const NonTransientErrorsByKey = {
	visaKey: {
		"Insufficient funds": true,
	},
	mastercardKey: {
		"Insufficient funds": true,
	}
};

const MAX_RETRIES = 3;

module.exports = {
	CompaniesName,
	CompaniesStatus,
	SupportedCompanies,
	ApiParams,
	CompanyToCompanyKey,
	ApiPathByKey,
	NonTransientErrorsByKey,
	MAX_RETRIES,
}