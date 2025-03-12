import { Logger } from '../../packages/common/logger';
import { ExternalApiError, TimeoutError, withTimeout } from '../common/error';

export class ProofApiService {
    protected baseUrls: { [networkId: number]: string };
    protected timeout: number;

    constructor(baseUrls: { [networkId: number]: string }) {
        this.baseUrls = baseUrls;
        this.timeout = 10000; // in milliseconds, 10 seconds
    }

    protected async makeRequest<T>(url: string, options: RequestInit = {}): Promise<T> {
        // Add default headers
        const headers = {
            // 'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...options.headers,
        };

        try {
            Logger.debug({ name: `Making request to merkle-proof`, url, method: options.method || 'GET' });

            // Wrap fetch with timeout
            const fetchWithTimeout = withTimeout(`merkle-proof API request`, this.timeout, async () => {
                const response = await fetch(url, {
                    ...options,
                    headers,
                });

                if (!response.ok) {
                    // Get error details from response if possible
                    let errorData;
                    try {
                        errorData = await response.json();
                    } catch (e) {
                        errorData = { message: response.statusText };
                    }

                    throw new ExternalApiError(
                        'merkle-proof',
                        errorData.message || `Request failed with status ${response.status}`,
                        {
                            externalCode: response.status,
                            rawError: errorData,
                            context: { url, method: options.method || 'GET' }
                        }
                    );
                }

                return await response.json() as T;
            });

            return await fetchWithTimeout();
        } catch (error) {
            // Re-throw ExternalApiError or TimeoutError
            if (error instanceof ExternalApiError || error instanceof TimeoutError) {
                throw error;
            }

            // Wrap other errors
            throw new ExternalApiError(
                'merkle-proof',
                error instanceof Error ? error.message : 'Unknown error',
                {
                    rawError: error,
                    context: { url, method: options.method || 'GET' }
                }
            );
        }
    }

    async getProof(depositCount: number, networkID: number): Promise<any> {
        return this.makeRequest(
            `${this.baseUrls[networkID]}/bridge_l1InfoTreeIndexForBridge?NetworkID=${networkID}&depositCount=${depositCount}`, {
            method: 'GET'
        }).then((infoTreeIndexForBridgeResult: any) => {
            return this.makeRequest(
                `${this.baseUrls[networkID]}/bridge_injectedInfoAfterIndex?NetworkID=${networkID}&L1InfoTreeIndex=${infoTreeIndexForBridgeResult.result.value}`, {
                method: 'GET'
            }).then((infoAfterIndexResult: any) => {
                return this.makeRequest(
                    `${this.baseUrls[networkID]}/bridge_getProof?NetworkID=${networkID}&depositCount=${depositCount}&L1InfoTreeIndex=${infoAfterIndexResult}`, {
                    method: 'GET'
                })
            })
        });
    }
}
