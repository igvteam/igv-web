/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2016-2017 The Regents of the University of California
 * Author: Jim Robinson
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

import { Alert, Utils, FileLoadManager, FileLoadWidget } from '../node_modules/igv-widgets/dist/igv-widgets.js';
import { DomUtils } from '../node_modules/igv-ui/dist/igv-ui.js';
import { loadGenome } from "./main.js";

class GenomeLoadController {

    constructor ({ genomes, genomeLoadModal, genomeFileLoad }) {

        this.genomes = genomes;

        // URL
        let config =
            {
                widgetParent: genomeLoadModal.querySelector('.modal-body'),
                dataTitle: 'Genome',
                indexTitle: undefined,
                mode: 'url',
                fileLoadManager: new FileLoadManager(),
                dataOnly: undefined,
                doURL: undefined
            };

        this.urlWidget = new FileLoadWidget(config);

        Utils.configureModal(this.urlWidget, genomeLoadModal, async fileLoadWidget => {
            await genomeFileLoad.loadPaths(fileLoadWidget.retrievePaths());
            return true;
        });

    }

    async getAppLaunchGenomes () {

        if(undefined === this.genomes) {
            return undefined;
        }

        if(Array.isArray(this.genomes)) {
            return buildDictionary(this.genomes);
        } else {

            let response = undefined;
            try {
                response = await fetch(this.genomes);
            } catch (e) {
                Alert.presentAlert(e.message);
            }

            if (response) {
                let json = await response.json();
                return buildDictionary(json);
            }

        }

    }

}

const buildDictionary = array => {

    let dictionary = {};
    if (true === Array.isArray(array)) {

        for (let json of array) {
            dictionary[ json.id ] = json;
        }

    } else {
        dictionary[ array.id ] = array;
    }

    return dictionary;
};

export const genomeDropdownLayout = ({ browser, genomeDictionary, dropdownMenu}) => {

    // discard all buttons preceeding the divider div
    let divider = dropdownMenu.querySelector('#igv-app-genome-dropdown-divider');
    getPreviousSiblings(divider).forEach(el => el.parentNode.removeChild(el));

    for (let [key, { name }] of Object.entries(genomeDictionary)) {

        let button = DomUtils.create('button', { class:'dropdown-item' });
        button.setAttribute('type', 'button');
        button.setAttribute('data-id', key);
        button.textContent =  name;

        divider.parentNode.insertBefore(button, divider);

        button.addEventListener('click', async () => {

            const id = button.getAttribute('data-id');
            if (id !== browser.genome.id) {
                await loadGenome(genomeDictionary[ id ]);
            }

        });

    }

};

const getPreviousSiblings = el => {
    let siblings = [];
    while (el = el.previousSibling) {
        siblings.push(el);
    }
    return siblings;
};

export default GenomeLoadController;

