export const idpRedirects = {
	'@test.com': 'whokta',
} as DomainRedirectMap

// e.g. {"@domain.com" : "redirectHint"}
export type DomainRedirectMap = {
	[domain: string]: string // domain: redirectHint
}
