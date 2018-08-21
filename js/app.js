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

'use strict';

var app = (function (app) {

    app.betterInit = function ($container, config) {

        if (config.googleConfig) {
            let gapiConfig =
                {
                    callback: function () {
                        let promise;

                        app.Google
                            .init(config.googleConfig.button)
                            .then(function () {

                                config.igvConfig['apiKey'] = igv.Google.properties['api_key'];
                                return igv.createBrowser($container.get(0), config.igvConfig);
                            })
                            .then(function (browser) {
                                app.Google.postInit();
                                app.initHelper(browser, $container, config);
                            });
                    },
                    onerror: function () {
                        console.log('gapi.client:auth2 - failed to load!');
                    }
                };

            gapi.load('client:auth2', gapiConfig);

        } else {
            igv
                .createBrowser($container.get(0), config.igvConfig)
                .then(function (browser) {
                    app.initHelper(browser, $container, config);
                });
        }
    };

    app.initHelper = function (browser, $container, options) {

        let $multipleFileLoadModal,
            mtflConfig,
            mgflConfig,
            sessionConfig,
            tlConfig,
            glConfig,
            shareConfig,
            $igv_app_dropdown_google_drive_track_file_button,
            $igv_app_dropdown_google_drive_genome_file_button;

        appFooterImageHoverBehavior($('.igv-app-footer').find('a img'));

        createAppBookmarkHandler(app, $('#igv-app-bookmark-button'));

        $multipleFileLoadModal = $('#igv-app-multiple-file-load-modal');

        $igv_app_dropdown_google_drive_track_file_button = $('#igv-app-dropdown-google-drive-track-file-button');
        if (undefined === options.googleConfig) {
            $igv_app_dropdown_google_drive_track_file_button.parent().hide();
        }

        mtflConfig =
            {
                $modal: $multipleFileLoadModal,
                modalTitle: 'Track File Error',
                $localFileInput: $('#igv-app-dropdown-local-track-file-input'),
                $dropboxButton: $('#igv-app-dropdown-dropbox-track-file-button'),
                $googleDriveButton: options.googleConfig ? $igv_app_dropdown_google_drive_track_file_button : undefined,
                configurationHandler: app.MultipleFileLoadController.trackConfigurator,
                fileLoadHandler: (configurations) => {
                    igv.browser.loadTrackList( configurations );
                }
            };
        app.multipleTrackFileLoader = new app.MultipleFileLoadController(browser, mtflConfig);

        $igv_app_dropdown_google_drive_genome_file_button = $('#igv-app-dropdown-google-drive-genome-file-button');
        if (undefined === options.googleConfig) {
            $igv_app_dropdown_google_drive_genome_file_button.parent().hide();
        }

        mgflConfig =
            {
                $modal: $multipleFileLoadModal,
                modalTitle: 'Genome File Error',
                $localFileInput: $('#igv-app-dropdown-local-genome-file-input'),
                $dropboxButton: $('#igv-app-dropdown-dropbox-genome-file-button'),
                $googleDriveButton: options.googleConfig ? $igv_app_dropdown_google_drive_genome_file_button : undefined,
                configurationHandler: app.MultipleFileLoadController.genomeConfigurator,
                fileLoadHandler: (configurations) => {
                    let config;
                    config = configurations[ 0 ];
                    app.utils.loadGenome(config);
                }
            };

        app.multipleGenomeFileLoader = new app.MultipleFileLoadController(browser, mgflConfig);

        // Genome Modal Controller
        glConfig =
            {
                $urlModal: $('#igv-app-genome-from-url-modal'),
            };
        app.genomeLoadController = new app.GenomeLoadController(browser, glConfig);

        app.genomeLoadController.getAppLaunchGenomes()
            .then(function (dictionary) {
                var gdConfig;

                gdConfig =
                    {
                        browser: browser,
                        genomeDictionary: dictionary,
                        $dropdown_menu: $('#igv-app-genome-dropdown-menu'),
                    };

                app.genomeDropdownLayout(gdConfig);
            });

        // Track load controller configuration
        tlConfig =
            {
                $urlModal: $('#igv-app-track-from-url-modal'),
                $encodeModal: $('#igv-app-encode-modal'),
                $dropdownMenu: $('#igv-app-track-dropdown-menu'),
                $genericTrackSelectModal: $('#igv-app-generic-track-select-modal')
            };

        app.trackLoadController = new app.TrackLoadController(browser, tlConfig);

        // Session Modal Controller
        /*
        sessionConfig =
            {
                $urlModal: $('#igv-app-session-url-modal'),
                $dropboxModal: $('#igv-app-session-dropbox-modal'),
                $googleDriveModal: $('#igv-app-session-google-drive-modal')
            };
        app.sessionModalController = new app.SessionModalController(browser, sessionConfig);

        $('#igv-app-session-file-input').on('change', function (e) {
            let file;
            file = e.target.files[ 0 ];
            browser.loadSession(file);
        });
        */

        // URL Shortener Configuration
        let $igv_app_tweet_button_container = $('#igv-app-tweet-button-container');
        if (options.urlShortenerConfig) {
            app.setURLShortener(options.urlShortenerConfig);
        } else {
            $igv_app_tweet_button_container.hide();
        }

        shareConfig =
            {
                $modal: $('#igv-app-share-modal'),
                $share_input: $('#igv-app-share-input'),
                $copy_link_button: $('#igv-app-copy-link-button'),
                $tweet_button_container: options.urlShortenerConfig ? $igv_app_tweet_button_container : undefined,
                $email_button: $('#igv-app-email-button'),
                $embed_button: $('#igv-app-embed-button'),
                $qrcode_button: $('#igv-app-qrcode-button'),
                $embed_container: $('#igv-app-embed-container'),
                $qrcode_image: $('#igv-app-qrcode-image')
            };

        app.shareController = new app.ShareController($container, browser, shareConfig);

    };

    function appFooterImageHoverBehavior ($img) {

        $img.hover(function () {
                $(this).attr('src', $(this).attr('src').replace(/\.png/, '-hover.png') );
            },
            function () {
                $(this).attr('src', $(this).attr('src').replace(/-hover\.png/, '.png') );
            });

    }

    function createAppBookmarkHandler (app, $bookmark_button) {

        $bookmark_button.on('click', function (e) {
            let blurb,
                str;

            window.history.pushState({}, "IGV", app.sessionURL());

            str = (/Mac/i.test(navigator.userAgent) ? 'Cmd' : 'Ctrl');
            blurb = 'A bookmark URL has been created. Press ' + str + '+D to save.';
            alert(blurb);
        });

    }

    return app;

})(app || {});