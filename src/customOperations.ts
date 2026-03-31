import { CustomOperationMap } from './model/operation'

import { setSponsors, preSetSponsors } from './operations/setSponsors'
import { getSponsors } from './operations/getSponsors'
import { getApplication } from './operations/getApplication'
import { setGuestGalVisibility } from './operations/setGuestGalVisibility'

/**
 * Custom Operations Map
 *
 * Maps hook patterns to operation functions. The key is in the format `hookPattern.attributePattern`.
 * Examples:
 * - `*.*` - Runs on all hooks for all attributes.
 * - `*.sponsors` - Runs on all hooks for the 'sponsors' attribute.
 * - `before*.sponsors` - Runs on all 'before' hooks for the 'sponsors' attribute.
 * - `beforeStdAccountList.*` - Runs on the beforeStdAccountList hook for all attributes.
 * - `afterStdAccountRead.sponsors` - Runs on the afterStdAccountRead hook for the 'sponsors' attribute.
 */
export const customOperations: CustomOperationMap = {
    'beforeStdAccountCreate.sponsors': [preSetSponsors],
    'afterStdAccountCreate.sponsors': [setSponsors],
    'beforeStdAccountUpdate.sponsors': [preSetSponsors],
    'afterStdAccountUpdate.sponsors': [setSponsors],
    'afterStdAccountCreate.invitedUserDisplayName': [setGuestGalVisibility],
    'afterStdAccountList.*': [getSponsors],
    'afterStdAccountRead.*': [getSponsors],
    'afterStdEntitlementList.application': [getApplication],
}
