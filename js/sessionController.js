import FileLoadWidget from "./fileLoadWidget.js";
import FileLoadManager from "./fileLoadManager.js";
import {configureModal} from "./utils.js";
import {getExtension} from "./utils";

class SessionController {

    constructor ({ browser, $urlModal, $saveButton, $saveModal }) {

        let urlConfig =
            {
                dataTitle: 'Load Session',
                $widgetParent: $urlModal.find('.modal-body'),
                mode: 'url',
                dataOnly: true
            };

        this.urlWidget = new FileLoadWidget(urlConfig, new FileLoadManager({ sessionJSON: true }));

        configureModal(this.urlWidget, $urlModal, (fileLoadManager) => {
            browser.loadSession( fileLoadManager.dictionary.data );
            return true;
        });

        configureSaveModal(browser, $saveModal);

        $saveButton.on('click', (e) => {
            $saveModal.modal();
        });

    }



}

function configureSaveModal(browser, $modal){

    let $input = $modal.find('input');

    let okHandler = () => {

        $modal.modal('hide');

        let filename = $input.val();
        $input.val('');

        const extensions = new Set(['json', 'xml']);

        if (undefined === filename || '' === filename) {

            filename = $input.attr('placeholder');
        } else if (false === extensions.has( getExtension( filename ) )) {

            filename = filename + '.json';
        }

        const json = browser.toJSON();
        const data = URL.createObjectURL(new Blob([ json ], { type: "application/octet-stream" }));
        igv.download(filename, data);

    };

    // ok - button
    let $ok = $modal.find('.modal-footer button:nth-child(2)');

    $ok.on('click', okHandler);

    $input.on('keyup', (e) => {
        if (13 === e.keyCode) {
            okHandler();
        }
    });

    // upper dismiss - x - button
    let $dismiss = $modal.find('.modal-header button:nth-child(1)');
    $dismiss.on('click', function () {
        $input.val('');
        $modal.modal('hide');
    });

    // lower dismiss - close - button
    $dismiss = $modal.find('.modal-footer button:nth-child(1)');
    $dismiss.on('click', function () {
        $input.val('');
        $modal.modal('hide');
    });

}

export default SessionController;
