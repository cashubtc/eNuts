const createBalanceView = `
CREATE VIEW IF NOT EXISTS balance AS
    SELECT COALESCE(SUM(p.amount), 0) AS balance
	FROM proofs as p
	WHERE p.amount > 0
;`

const createBalanceUsedView = `
CREATE VIEW IF NOT EXISTS balance_used AS
	SELECT COALESCE(SUM(p.amount), 0) AS used
	FROM proofsUsed as p
	WHERE amount > 0
;`

const createMintBalancesView = `
CREATE VIEW IF NOT EXISTS MintBalances AS
	SELECT k.mintUrl AS mintUrl, COALESCE(SUM(p.amount), 0) AS balance
	FROM keysetIds AS k
	LEFT JOIN proofs AS p ON k.id = p.id
	GROUP BY mintUrl
;
`

export const views: readonly string[] = [
	createBalanceView,
	createBalanceUsedView,
	createMintBalancesView
]