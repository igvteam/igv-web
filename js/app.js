/*
 *  The MIT License (MIT)
 *
 * Copyright (c) 2016-2017 The Regents of the University of California
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and
 * associated documentation files (the "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the
 * following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial
 * portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
 * BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,  FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
 * CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
 * ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 *
 */

import igv from '../node_modules/igv/dist/igv.esm.js';
import { dropboxButtonImageBase64, googleDriveButtonImageBase64 } from '../node_modules/igv-ui/src/index.js'
import { Alert, EventBus, GoogleFilePicker } from '../node_modules/igv-widgets/dist/igv-widgets.js';
import Globals from "./globals.js"
import { creatGenomeWidgets, initializeGenomeWidgets, genomeWidgetConfigurator } from './genomeWidgets.js';
import { shareWidgetConfigurator, createShareWidgets } from './shareWidgets.js';
import { sessionURL } from './shareHelper.js';
import { createSVGWidget } from './svgWidget.js';
import {createTrackWidgets} from "./trackWidgets.js";
import {createSessionWidgets} from "./sessionWidgets.js";

$(document).ready(async () => main($('#igv-app-container'), igvwebConfig));

let trackLoadController;
let googleEnabled = false;

let main = async ($container, config) => {

    Alert.init($container.get(0));

    const enableGoogle = config.clientId && 'CLIENT_ID' !== config.clientId && (window.location.protocol === "https:" || window.location.host === "localhost");

    if (enableGoogle) {

        let browser;
        const googleConfig =
            {
                callback: async () => {

                    try {
                        await GoogleFilePicker.init(config.clientId, igv.oauth, igv.google);
                        googleEnabled = true;
                    } catch (e) {
                        console.error(e);
                        Alert.presentAlert(e.message)
                    }

                    browser = await igv.createBrowser($container.get(0), config.igvConfig);
                    Globals.browser = browser;

                    if (googleEnabled) {
                        GoogleFilePicker.postInit();
                    }

                    await initializationHelper(browser, $container, config);

                },
                onerror: async (e) => {
                    console.error(e);
                    Alert.presentAlert(e.message)
                }
            };

        gapi.load('client:auth2', googleConfig);

    } else {

        let browser = await igv.createBrowser($container.get(0), config.igvConfig);
        Globals.browser = browser;
        await initializationHelper(browser, $container, config);

    }
}

let initializationHelper = async (browser, $container, options) => {

    [ 'track', 'genome', 'session' ].forEach(str => {
        let imgElement;

        imgElement = document.querySelector(`img#igv-app-${ str }-dropbox-button-image`);
        imgElement.src = `data:image/svg+xml;base64,${ dropboxButtonImageBase64() }`;

        imgElement = document.querySelector(`img#igv-app-${ str }-google-drive-button-image`);
        imgElement.src = `data:image/svg+xml;base64,${ googleDriveButtonImageBase64() }`;
    })

    creatGenomeWidgets(genomeWidgetConfigurator())
    await initializeGenomeWidgets(browser, options.genomes, $('#igv-app-genome-dropdown-menu'))

    await createTrackWidgets($('#igv-main'), $('#igv-app-track-dropdown-menu'), $('#igv-app-dropdown-local-track-file-input'), $('#igv-app-dropdown-dropbox-track-file-button'), googleEnabled, $('#igv-app-dropdown-google-drive-track-file-button'), 'igv-app-encode-modal', 'igv-app-track-from-url-modal', 'igv-app-track-select-modal', igv.xhr, igv.google, options.trackRegistryFile, async configurations => await browser.loadTrackList(configurations));

    createSessionWidgets($('#igv-main'), igv.xhr, igv.google, 'igv-webapp', 'igv-app-dropdown-local-session-file-input', 'igv-app-dropdown-dropbox-session-file-button', 'igv-app-dropdown-google-drive-session-file-button', 'igv-app-session-url-modal', 'igv-app-session-save-modal', googleEnabled, async config => { await browser.loadSession(config) }, () => browser.toJSON());

    createSVGWidget({ browser, $saveModal: $('#igv-app-svg-save-modal') })

    createShareWidgets(shareWidgetConfigurator(browser, $container, options));

    createAppBookmarkHandler($('#igv-app-bookmark-button'));

    EventBus.globalBus.post({ type: "DidChangeGenome", data: { genomeID: browser.genome.id } });
}

const createAppBookmarkHandler = $bookmark_button => {

    $bookmark_button.on('click', (e) => {
        let blurb,
            str;

        window.history.pushState({}, "IGV", sessionURL());

        str = (/Mac/i.test(navigator.userAgent) ? 'Cmd' : 'Ctrl');
        blurb = 'A bookmark URL has been created. Press ' + str + '+D to save.';
        alert(blurb);
    });

}

export { main, googleEnabled, trackLoadController }
