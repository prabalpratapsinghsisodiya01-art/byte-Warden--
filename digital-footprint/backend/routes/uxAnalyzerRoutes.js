const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const https = require('https');
const router = express.Router();
const rateLimit = require('express-rate-limit');

// Rate limiter for UX Analysis
const uxLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 20, // 20 audits per 5 min
    message: { error: 'Too many analysis requests, please try again later.' }
});

router.get('/', uxLimiter, async (req, res) => {
    let targetUrl = req.query.url;
    
    if (!targetUrl) {
        return res.status(400).json({ error: 'Missing url parameter.' });
    }

    try {
        if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
            targetUrl = 'https://' + targetUrl;
        }
        
        const agent = new https.Agent({  
            rejectUnauthorized: false
        });

        const response = await axios.get(targetUrl, {
            httpsAgent: agent,
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ByteWarden/UXAnalyzer' },
            timeout: 10000 // 10s timeout
        });

        const html = response.data;
        const $ = cheerio.load(html);
        
        // Find password fields
        const passwordFields = $('input[type="password"]');
        
        let score = 100;
        const passedChecks = [];
        const failedChecks = [];
        const fixes = [];

        if (passwordFields.length === 0) {
            return res.status(400).json({ error: 'No password fields (<input type="password">) found on this page.' });
        }

        // We will analyze the first password field found for simplicity, or aggregate them.
        const focusField = passwordFields.first();
        const inputStr = $.html(focusField); // raw html of the element for context in fix
        
        // 1. Autofill Check
        const autocomplete = focusField.attr('autocomplete');
        if (autocomplete && (autocomplete === 'new-password' || autocomplete === 'current-password')) {
            passedChecks.push('✅ Excellent: Correct autocomplete attribute set for password managers.');
        } else {
            score -= 20;
            failedChecks.push('❌ Missing or incorrect autocomplete attribute.');
            fixes.push('Add `autocomplete="new-password"` (for signups) or `autocomplete="current-password"` (for logins) to your password inputs. This ensures password managers can correctly autofill credentials without friction.');
        }

        // 2. Paste-blocking check
        const onpaste = focusField.attr('onpaste');
        if (onpaste && onpaste.includes('return false')) {
            score -= 30;
            failedChecks.push('❌ Critical UX Failure: Paste blocking detected.');
            fixes.push('Remove the `onpaste="return false;"` attribute immediately. The NCSC and NIST highly recommend allowing users to paste passwords, as blocking it stops them from using password managers and forces them to choose weak, memorable passwords.');
        } else {
            passedChecks.push('✅ Good: No inline paste-blocking (`onpaste="return false"`) detected.');
        }

        // 3. Length attributes
        const maxlength = focusField.attr('maxlength');
        if (maxlength) {
            if (parseInt(maxlength) < 64) {
                score -= 15;
                failedChecks.push(`⚠️ Restrictive Max-Length: Set to ${maxlength}`);
                fixes.push(`Increase your \`maxlength\` (currently ${maxlength}). Best practice is to allow at least 64-128 characters to support long, generated passphrases from password managers.`);
            } else {
                passedChecks.push(`✅ Good: Safe max-length allowed (${maxlength} chars).`);
            }
        } else {
             passedChecks.push('✅ Good: No max-length restrictions found, allowing secure passphrases.');
        }

        // 4. Strength Meter check (Heuristic: Look for elements hinting at a meter near the input)
        // We look for 'strength', 'meter', or 'progress' classes nearby.
        let foundMeter = false;
        const bodyHtml = $('body').html().toLowerCase();
        if (bodyHtml.includes('strength') || bodyHtml.includes('meter') || bodyHtml.includes('zxcvbn')) {
            foundMeter = true;
            passedChecks.push('✅ Good: Possible password strength meter elements detected on page.');
        } else {
            // Not necessarily a failure if it's a login page, but we dock minor points
            score -= 10;
            failedChecks.push('⚠️ Missing: No obvious strength meter or `zxcvbn` library detected.');
            fixes.push('If this is a signup page, implement a dynamic strength meter (like Dropbox\'s zxcvbn) to give users real-time feedback on password complexity. Avoid static regex rules.');
        }

        // Final Grade Calculation
        let grade = 'A';
        if (score < 60) grade = 'F';
        else if (score < 70) grade = 'D';
        else if (score < 80) grade = 'C';
        else if (score < 90) grade = 'B';
        
        if (score < 0) score = 0;

        res.json({
            url: targetUrl,
            foundFieldsCount: passwordFields.length,
            score,
            grade,
            passedChecks,
            failedChecks,
            fixes
        });

    } catch (error) {
        console.error('UX Analyzer Error:', error.message);
        res.status(500).json({ error: `Failed to analyze URL: ${error.message}` });
    }
});

module.exports = router;
