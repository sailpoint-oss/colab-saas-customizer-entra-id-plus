/**
 * General-purpose utilities
 *
 * Helpers shared across the customizer framework and individual
 * operation implementations:
 *
 * - `getLogger` — configures and returns the SDK logger.
 * - `getAttributeChangeAndValue` — resolves an attribute value from the
 *   before-operation input (handles both `attributes` and `changes`).
 * - `setAttribute` / `setAttributeImmutable` — write a value to an object
 *   using the attribute path convention.
 *
 * The core operation engine (runners) lives in `operationRunner.ts`.
 */
import { AttributeChange, logger } from '@sailpoint/connector-sdk'
import { AccountBeforeOperationInput, EntitlementBeforeOperationInput, AnyBeforeOperationInput } from './model/operation'

// ---------------------------------------------------------------------------
// Logger helper
// ---------------------------------------------------------------------------

/** Configures the SDK logger level based on the debug flag and returns it. */
export const getLogger = (isDebug: boolean) => {
    logger.level = isDebug ? 'debug' : 'info'
    return logger
}

// ---------------------------------------------------------------------------
// Input helpers
// ---------------------------------------------------------------------------

/**
 * Resolves an attribute value from before-operation input.
 * Checks both `input.attributes` and `input.changes` (for update payloads).
 * Returns the matching AttributeChange (if any) and the resolved value.
 */
export const getAttributeChangeAndValue = (
    input: AnyBeforeOperationInput,
    attributeName: string
): { change: AttributeChange | undefined; value: unknown } => {
    const inputAny = input as any
    const change = inputAny.changes?.find((c: any) => c.attribute === attributeName)
    const value = inputAny.attributes?.[attributeName] ?? change?.value
    return { change, value }
}

// ---------------------------------------------------------------------------
// Attribute setters
// ---------------------------------------------------------------------------

/**
 * Mutates `object` by setting the value at the given attribute path.
 *
 * Path conventions:
 *  - 'attributes.foo'  →  object.attributes.foo = value
 *  - 'disabled'        →  object.disabled = value
 *
 * Returns true on success, false if the object is frozen or missing.
 */
export const setAttribute = (object: any, attribute: string, value: any): boolean => {
    if (!object) return false
    if (attribute.startsWith('attributes.')) {
        const key = attribute.substring('attributes.'.length)
        try {
            if (!object.attributes) object.attributes = {}
            object.attributes[key] = value
            return true
        } catch {
            return false
        }
    }
    try {
        object[attribute] = value
        return true
    } catch {
        return false
    }
}

/**
 * Immutable variant of setAttribute. Returns a shallow copy of `object` with
 * the attribute set. Use when the SDK output object is frozen and cannot be
 * mutated in place.
 */
export const setAttributeImmutable = (object: any, attribute: string, value: any): any => {
    if (!object) return object
    if (attribute.startsWith('attributes.')) {
        const key = attribute.substring('attributes.'.length)
        const attrs = object.attributes ?? {}
        return { ...object, attributes: { ...attrs, [key]: value } }
    }
    return { ...object, [attribute]: value }
}
