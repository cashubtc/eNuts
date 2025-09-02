import { CashuMint, deriveKeysetId } from "@cashu/cashu-ts";
import { l } from "@log";
import type { IMint } from "@model";
import { arrToChunks } from "@util";
import { db } from "./database";

async function getCurrentKeySetId(mintUrl: string) {
    const keys = await CashuMint.getKeys(mintUrl);
    const keySetId = deriveKeysetId(keys);
    return keySetId;
}

// ################################ Mints/Keysets ################################
export async function getMints(): Promise<IMint[]> {
    const result = await db.all<IMint>("select * from keysetIds");
    l("[getMints]", result);
    if (!result || !result.length) {
        return [];
    }
    return result;
}

/**
 * get all unique mint urls in db
 *
 *	if asObj is false or undefined, returns array of strings

 * @export
 * @param {false} [asObj] optional, if false or undefined, returns array of strings
 * @return {*}  {Promise<string[]>}
 */
export async function getMintsUrls(asObj?: false): Promise<string[]>;
/**
 * get all unique mint urls in db
 *
 *	if asObj is true, returns array of objects with key mintUrl

 * @deprecated  this overload will be removed in the future
 *
 * @export
 * @param {true} asObj
 * @return {*}  {Promise<{ mintUrl: string }[]>}
 */
export async function getMintsUrls(asObj: true): Promise<{ mintUrl: string }[]>;
export async function getMintsUrls(
    asObj = false
): Promise<(string | { mintUrl: string })[]> {
    const result = await db.all<{ mintUrl: string }>(
        "select DISTINCT mintUrl from keysetIds"
    );
    l("[Mints]", result);
    if (!result || !result.length) {
        return [];
    }
    return asObj ? result : result.map((x) => x.mintUrl);
}

export async function addMint(mint: IMint): Promise<boolean> {
    const sql =
        "INSERT OR IGNORE INTO keysetIds (id, mintUrl, active, fee) VALUES (?, ?, ?, ?)";
    if (!mint.id) {
        mint.id = await getCurrentKeySetId(mint.mintUrl);
    }
    const params = [mint.id, mint.mintUrl, mint.active, mint.fee];
    const result = await db.run(sql, params);
    l("[addMint]", result);
    return result?.changes === 1;
}

async function _addMints(
    ...args: { mintUrl: string; id: string }[]
): Promise<boolean> {
    if (!args || !args.length) {
        return false;
    }
    const sqlPrefix = "INSERT OR IGNORE INTO keysetIds (id, mintUrl) VALUES ";
    const sqlSuffix = args.map((_) => "(?, ?)").join(" , ");
    const sql = sqlPrefix + sqlSuffix;
    const params = args.flatMap((x) => [x.id, x.mintUrl]);
    const result = await db.run(sql, params);
    l("[addMints]", result);
    return result?.changes === args.length;
}

export async function addMints(
    ...args: { mintUrl: string; id: string }[]
): Promise<boolean> {
    if (!args || !args.length) {
        return false;
    }
    const results: boolean[] = [];
    for (const arr of arrToChunks(args, 100)) {
        results.push(await _addMints(...arr));
    }
    return results.every((x) => x);
}

export async function addAllMintIds() {
    const mints = await getMints();
    const toDo: { mintUrl: string; id: string }[] = [];
    for (const mint of mints) {
        const keysets = await CashuMint.getKeySets(mint.mintUrl);
        for (const keyset of keysets.keysets) {
            if (
                mints.some(
                    (x) => x.id === keyset.id && x.mintUrl === mint.mintUrl
                )
            ) {
                continue;
            }
            toDo.push({ mintUrl: mint.mintUrl, id: keyset.id });
        }
    }
    await addMints(...toDo);
}

export async function hasMints(): Promise<boolean> {
    const mintCountResult = await db.first<{ count: number }>(
        "SELECT count(id) as count FROM keysetIds limit 1"
    );
    l("[hasMints]", mintCountResult);
    return !!mintCountResult?.count;
}

export async function getMintByKeySetId(
    id: string
): Promise<IMint | undefined | null> {
    const mint = await db.first<IMint>("SELECT * FROM keysetIds WHERE id = ?", [
        id,
    ]);
    l("[getMintByKeySetId]", mint);
    return mint;
}

export async function getMintIdsByUrl(mintUrl: string): Promise<IMint[]> {
    const mintIds = await db.all<IMint>(
        "SELECT * FROM keysetIds WHERE mintUrl = ?",
        [mintUrl]
    );
    l("[getMintIdsByUrl]", mintIds);
    if (!mintIds || !mintIds.length) {
        return [];
    }
    return mintIds;
}

export async function deleteMint(mintUrl: string) {
    const result = await db.run("DELETE from keysetIds WHERE mintUrl = ?", [
        mintUrl,
    ]);
    l("[deleteMint]", result);
    return result?.changes === 1;
}
