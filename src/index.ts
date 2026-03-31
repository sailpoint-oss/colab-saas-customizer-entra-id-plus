/**
 * Connector Customizer entry point
 *
 * This file wires the operation runners to every standard SDK command.
 * The pattern is intentionally exhaustive: every account and entitlement
 * command gets both a before and after handler. If no operations are
 * registered for a given map the handler is a no-op (returns input/output unchanged).
 *
 * To support a new connector:
 *   - Only update `customOperations.ts`
 *   - Swap the API client (EntraIdClient) for your target system
 *   - No changes needed in this file or in the framework utilities
 */
import { createConnectorCustomizer, logger } from '@sailpoint/connector-sdk'
import { runBeforeOperations, runAfterOperations } from './operationRunner'
import { customOperations } from './customOperations'

export const connectorCustomizer = async () => {
    logger.info('Initializing connector customizer')

    return createConnectorCustomizer()
        // Test Connection
        .beforeStdTestConnection(runBeforeOperations('beforeStdTestConnection', customOperations))
        .afterStdTestConnection(runAfterOperations('afterStdTestConnection', customOperations))
        // Account
        .beforeStdAccountCreate(runBeforeOperations('beforeStdAccountCreate', customOperations))
        .afterStdAccountCreate(runAfterOperations('afterStdAccountCreate', customOperations))
        .beforeStdAccountRead(runBeforeOperations('beforeStdAccountRead', customOperations))
        .afterStdAccountRead(runAfterOperations('afterStdAccountRead', customOperations))
        .beforeStdAccountUpdate(runBeforeOperations('beforeStdAccountUpdate', customOperations))
        .afterStdAccountUpdate(runAfterOperations('afterStdAccountUpdate', customOperations))
        .beforeStdAccountDelete(runBeforeOperations('beforeStdAccountDelete', customOperations))
        .afterStdAccountDelete(runAfterOperations('afterStdAccountDelete', customOperations))
        .beforeStdAccountEnable(runBeforeOperations('beforeStdAccountEnable', customOperations))
        .afterStdAccountEnable(runAfterOperations('afterStdAccountEnable', customOperations))
        .beforeStdAccountDisable(runBeforeOperations('beforeStdAccountDisable', customOperations))
        .afterStdAccountDisable(runAfterOperations('afterStdAccountDisable', customOperations))
        .beforeStdAccountUnlock(runBeforeOperations('beforeStdAccountUnlock', customOperations))
        .afterStdAccountUnlock(runAfterOperations('afterStdAccountUnlock', customOperations))
        .beforeStdAccountList(runBeforeOperations('beforeStdAccountList', customOperations))
        .afterStdAccountList(runAfterOperations('afterStdAccountList', customOperations))
        // Authenticate
        .beforeStdAuthenticate(runBeforeOperations('beforeStdAuthenticate', customOperations))
        .afterStdAuthenticate(runAfterOperations('afterStdAuthenticate', customOperations))
        // Config Options
        .beforeStdConfigOptions(runBeforeOperations('beforeStdConfigOptions', customOperations))
        .afterStdConfigOptions(runAfterOperations('afterStdConfigOptions', customOperations))
        // Application Discovery List
        .beforeStdApplicationDiscoveryList(runBeforeOperations('beforeStdApplicationDiscoveryList', customOperations))
        .afterStdApplicationDiscoveryList(runAfterOperations('afterStdApplicationDiscoveryList', customOperations))
        // Entitlement
        .beforeStdEntitlementRead(runBeforeOperations('beforeStdEntitlementRead', customOperations))
        .afterStdEntitlementRead(runAfterOperations('afterStdEntitlementRead', customOperations))
        .beforeStdEntitlementList(runBeforeOperations('beforeStdEntitlementList', customOperations))
        .afterStdEntitlementList(runAfterOperations('afterStdEntitlementList', customOperations))
        // Change Password
        .beforeStdChangePassword(runBeforeOperations('beforeStdChangePassword', customOperations))
        .afterStdChangePassword(runAfterOperations('afterStdChangePassword', customOperations))
        // Source Data
        .beforeStdSourceDataDiscover(runBeforeOperations('beforeStdSourceDataDiscover', customOperations))
        .afterStdSourceDataDiscover(runAfterOperations('afterStdSourceDataDiscover', customOperations))
        .beforeStdSourceDataRead(runBeforeOperations('beforeStdSourceDataRead', customOperations))
        .afterStdSourceDataRead(runAfterOperations('afterStdSourceDataRead', customOperations))
}
