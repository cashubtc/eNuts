const createBalanceView = `
CREATE VIEW IF NOT EXISTS balance AS
        SELECT COALESCE(SUM(s), 0) AS balance FROM (
            SELECT SUM(amount) AS s
            FROM proofs
            WHERE amount > 0
);
`

const createBalanceUsedView = `
CREATE VIEW IF NOT EXISTS balance_used AS
        SELECT COALESCE(SUM(s), 0) AS used FROM (
            SELECT SUM(amount) AS s
            FROM proofs_used
            WHERE amount > 0
);
`

export const views: readonly string[] = [
	createBalanceView,
	createBalanceUsedView
]