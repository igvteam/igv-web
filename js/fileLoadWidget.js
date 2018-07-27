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

/**
 * Created by dat on 4/8/18.
 */
var app = (function (app) {
    app.FileLoadWidget = function (config, fileLoadManager) {
        var self = this,
            obj;

        this.config = config;

        this.config.dataTitle = config.dataTitle || 'Data';
        this.config.indexTitle = config.indexTitle || 'Index';

        this.$parent = config.$widgetParent;

        this.fileLoadManager = fileLoadManager;
        this.fileLoadManager.fileLoadWidget = this;

        // file load widget
        this.$container = $('<div>', { class: 'igv-file-load-widget-container' });
        this.$parent.append(this.$container);

        if ('localFile' === config.mode) {
            // local data/index
            obj =
                {
                    doURL: false,
                    dataTitle: config.dataTitle + ' file',
                    indexTitle: config.indexTitle + ' file'
                };
            createInputContainer.call(this, this.$container, obj);
        } else {

            // url data/index
            obj =
                {
                    doURL: true,
                    dataTitle: config.dataTitle + ' URL',
                    indexTitle: config.indexTitle + ' URL'
                };
            createInputContainer.call(this, this.$container, obj);
        }

        // error message container
        this.$error_message = $("<div>", { class:"igv-flw-error-message-container" });
        this.$container.append(this.$error_message);

        // error message
        this.$error_message.append($("<div>", { class:"igv-flw-error-message" }));

        // error dismiss button
        igv.attachDialogCloseHandlerWithParent(this.$error_message, function () {
            self.dismissErrorMessage();
        });

        this.dismissErrorMessage();

    };

    app.FileLoadWidget.prototype.presentErrorMessage = function(message) {
        this.$error_message.find('.igv-flw-error-message').text(message);
        this.$error_message.show();
    };

    app.FileLoadWidget.prototype.dismissErrorMessage = function() {
        this.$error_message.hide();
        this.$error_message.find('.igv-flw-error-message').text('');
    };

    app.FileLoadWidget.prototype.present = function () {
        this.$container.show();
    };

    app.FileLoadWidget.prototype.dismiss = function () {

        this.dismissErrorMessage();

        this.$container.find('input').val(undefined);
        this.$container.find('.igv-flw-local-file-name-container').hide();

        this.fileLoadManager.reset();

    };

    app.FileLoadWidget.prototype.customizeLayout = function (customizer) {
        customizer(this.$container);
    };

    function createInputContainer($parent, config) {
        var $container,
            $input_data_row,
            $input_index_row,
            $label;

        // container
        $container = $("<div>", { class:"igv-flw-input-container" });
        $parent.append($container);


        // data
        $input_data_row = $("<div>", { class:"igv-flw-input-row" });
        $container.append($input_data_row);
        // label
        $label = $("<div>", { class:"igv-flw-input-label" });
        $input_data_row.append($label);
        $label.text(config.dataTitle);

        if (true === config.doURL) {
            createURLContainer.call(this, $input_data_row, 'igv-flw-data-url', false);
        } else {
            createLocalFileContainer.call(this, $input_data_row, 'igv-flw-local-data-file', false);
        }

        // index
        $input_index_row = $("<div>", { class:"igv-flw-input-row" });
        $container.append($input_index_row);
        // label
        $label = $("<div>", { class:"igv-flw-input-label" });
        $input_index_row.append($label);
        $label.text(config.indexTitle);

        if (true === config.doURL) {
            createURLContainer.call(this, $input_index_row, 'igv-flw-index-url', true);
        } else {
            createLocalFileContainer.call(this, $input_index_row, 'igv-flw-local-index-file', true);
        }

    }

    function createURLContainer($parent, id, isIndexFile) {
        var self = this,
            $input;

        $input = $('<input>', { type:'text', placeholder:(true === isIndexFile ? 'Enter index URL' : 'Enter data URL') });
        $parent.append($input);

        $input.on('focus', function () {
            self.dismissErrorMessage();
        });

        $input.on('change', function (e) {
            self.dismissErrorMessage();
            self.fileLoadManager.inputHandler($(this).val(), isIndexFile);
        });

        $parent
            .on('drag dragstart dragend dragover dragenter dragleave drop', function (e) {
                e.preventDefault();
                e.stopPropagation();
                self.dismissErrorMessage();
            })
            .on('dragover dragenter', function (e) {
                $(this).addClass('igv-flw-input-row-hover-state');
            })
            .on('dragleave dragend drop', function (e) {
                $(this).removeClass('igv-flw-input-row-hover-state');
            })
            .on('drop', function (e) {
                if (false === self.fileLoadManager.didDragDrop(e.originalEvent.dataTransfer)) {
                    self.fileLoadManager.dragDropHandler(e.originalEvent.dataTransfer, isIndexFile);
                    $input.val(isIndexFile ? self.fileLoadManager.indexName() : self.fileLoadManager.dataName());
                }
            });

    }

    function createLocalFileContainer($parent, id, isIndexFile) {
        var self = this,
            $file_chooser_container,
            $label,
            $input,
            $file_name,
            str;

        $file_chooser_container = $("<div>", { class:"igv-flw-file-chooser-container" });
        $parent.append($file_chooser_container);


        str = id + igv.guid();

        $label = $('<label>', { for:str });
        $file_chooser_container.append($label);
        $label.text('Choose file');

        $input = $('<input>', { class:"igv-flw-file-chooser-input", id:str, name:str, type:'file' });
        $file_chooser_container.append($input);

        $file_chooser_container.hover(
            function() {
                $label.removeClass('igv-flw-label-color');
                $label.addClass('igv-flw-label-color-hover');
            }, function() {
                $label.removeClass('igv-flw-label-color-hover');
                $label.addClass('igv-flw-label-color');
            }
        );

        $file_name = $("<div>", { class:"igv-flw-local-file-name-container" });
        $parent.append($file_name);

        $file_name.hide();

        $input.on('change', function (e) {

            self.dismissErrorMessage();

            self.fileLoadManager.inputHandler(e.target.files[ 0 ], isIndexFile);

            $file_name.text(e.target.files[ 0 ].name);
            $file_name.attr('title', e.target.files[ 0 ].name);
            $file_name.show();
        });

        $parent
            .on('drag dragstart dragend dragover dragenter dragleave drop', function (e) {
                e.preventDefault();
                e.stopPropagation();
                self.dismissErrorMessage();
            })
            .on('dragover dragenter', function (e) {
                $(this).addClass('igv-flw-input-row-hover-state');
            })
            .on('dragleave dragend drop', function (e) {
                $(this).removeClass('igv-flw-input-row-hover-state');
            })
            .on('drop', function (e) {
                var str;
                if (true === self.fileLoadManager.didDragDrop(e.originalEvent.dataTransfer)) {
                    self.fileLoadManager.dragDropHandler(e.originalEvent.dataTransfer, isIndexFile);
                    str = isIndexFile ? self.fileLoadManager.indexName() : self.fileLoadManager.dataName();
                    $file_name.text(str);
                    $file_name.attr('title', str);
                    $file_name.show();

                }
            });

    }

    return app;

})(app || {});