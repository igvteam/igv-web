/**
 * Configuration file for igv-webapp.   This is intentionally not a module so it can be used pre and post webpacking
 */

"use strict";

var igvwebConfig = {

    genomes: "resources/genomes.json",

    trackRegistryFile: "resources/tracks/trackRegistry.json",

    embedTarget: 'https://igv.org/web/release/2.3.0/embed.html',

    igvConfig:
        {
            genomeList: "resources/genomes.json",
            queryParametersSupported: true,
            showChromosomeWidget: true,
            showSVGButton: false,
            genome: "hg19",

            // Supply a Google API key to access public Google resources.  This is optional.
            apiKey: "AIzaSyDUUAUFpQEN4mumeMNIRWXSiTh5cPtUAD0"
        },

    // Supply a Google client id to enable the Google file picker in the load menus.  This is optional
    clientId: "661332306814-8nt29308rppg325bkq372vli8nm3na14.apps.googleusercontent.com",

    // Provide a URL shorterner function or object.   This is optional.  If not supplied sharable URLs will not
    // be shortened.
    urlShortener:
        [
            {
                provider: 'tinyURL'
            }
        ]

};


