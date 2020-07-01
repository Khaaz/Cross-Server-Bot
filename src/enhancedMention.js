'use strict';

const { Resolver } = require('./Resolver');
const config = require('../config.json');

const TRY_MENTION_REGEX = /(?<=((\?<!<)@|(?<!<)#))(\S+)/;
const MENTION_REGEX = /<(@&|@|#)!?([0-9]+)>/;

const ENHANCED_MENTION_CONFIG = config.enhancedMention || { user: false, role: false, channel: false };

/**
 * From a match, resolve the name of the user / channel / role
 * or resolve an object with the user / channel / role object to be used later for mention
 * @param {*} match
 * @param {*} guild
 */
function extractMention(match, guild) {
    const type = match[1];
    const toResolve = match[2];
    if (type === '@') { // user mention
        const resolved = Resolver.member(guild, toResolve);
        if (!resolved) {
            return match[0];
        }

        return ENHANCED_MENTION_CONFIG.user
            ? { type: 1, resolved }
            : `\\@${resolved.username}#${resolved.discriminator}`;
    }

    if (type === '@&') { // role mention
        const resolved = Resolver.role(guild, toResolve);
        if (!resolved) {
            return match[0];
        }
        
        return ENHANCED_MENTION_CONFIG.role
            ? { type: 2, resolved }
            : `\\@${resolved.name}`;
    }
    if (type === '#') { // channel mention
        const resolved = Resolver.channel(guild, toResolve);
        if (!resolved) {
            return match[0];
        }
        
        return ENHANCED_MENTION_CONFIG.channel
            ? { type: 3, resolved }
            : `\\#${resolved.name}`;
    }
    return null;
}

/**
 * Resolve the mention from the mention-build object
 * @param {*} toResolve
 * @param {*} guild
 */
function resolve(toResolve, guild) {
    if (toResolve.type === 1) { // user
        const resolved = Resolver.member(guild, toResolve.resolved.id);
        return resolved
            ? resolved.mention
            : `${toResolve.resolved.username}#${toResolve.resolved.discriminator}`;
    }

    if (toResolve.type === 2) { // role
        const resolved = Resolver.role(guild, toResolve.resolved.name);
        return resolved
            ? resolved.mention
            : `@${toResolve.resolved.name}`;
    }

    if (toResolve.type === 3) { // channel
        const resolved = Resolver.channel(guild, toResolve.resolved.name);
        return resolved
            ? resolved.mention
            : `#${toResolve.resolved.name}`;
    }
    return null;
}

/**
 * Parse the mention from the mention string.
 * @param {*} content
 * @param {*} guild
 * @returns
 */
function parse(content, guild) {
    const res = content.match(TRY_MENTION_REGEX);
    if (!res) {
        return content;
    }

    let resolved = null;
    if (res[1] === '@') {
        resolved = ENHANCED_MENTION_CONFIG.role
            ? Resolver.role(guild, res[2] )
            : null;
        if (resolved) {
            return resolved.mention;
        }

        resolved = ENHANCED_MENTION_CONFIG.user
            ? Resolver.member(guild, res[2] )
            : null;
        if (resolved) {
            return resolved.mention;
        }
        return content;
    }
    if (ENHANCED_MENTION_CONFIG.channel && res[1] === '#') {
        resolved = Resolver.channel(guild, res[2] );
        return resolved
            ? resolved.mention
            : content;
    }
    return content;
}

/**
 * Returns an array of the original message but every mention are replaced by the string or the build-mention Object
 * @param {*} content
 * @param {*} guild
 */
exports.deconstructMention = function (content, guild) {
    const contentArr = content.split(' ');
    const final = [];

    for (const e of contentArr) {
        const res = e.match(MENTION_REGEX);
        res
            ? final.push(extractMention(res, guild) )
            : final.push(e);
    }
    return final;
};

/**
 * Contruct the message from an array of the message content. All mentions in the array are a string with the mention or a build-mention object
 * @param {*} contentArr
 * @param {*} guild
 */
exports.enhanceMention = function (contentArr, guild) {
    const final = [];

    for (const e of contentArr) {
        const resolved = typeof e != 'string'
            ? resolve(e, guild)
            : parse(e, guild);

        final.push(resolved);
    }
    return final.join(' ');
};
