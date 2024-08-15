import {FileUtils} from '../../node_modules/igv-utils/src/index.js'
import {createLoadDropdown} from "./loadWidget.js"

function createSessionLoadSaveDropdown({ igvMain,
                                           localFileInput,
                                           initializeDropbox,
                                           dropboxButton,
                                           googleEnabled,
                                           googleDriveButton,
                                           urlModalId,
                                           urlModalTitle,
                                           saveModalId,
                                           loadHandler,
                                           saveHandler }) {

    const urlLoadModal = createLoadDropdown({ igvMain,
        localFileInput,
        initializeDropbox,
        dropboxButton,
        googleEnabled,
        googleDriveButton,
        urlModalId,
        urlModalTitle,
        loadHandler })


    const saveModal = configureSaveSessionModal(igvMain, 'igv-webapp', saveHandler, saveModalId)

    return { urlLoadModal, saveModal }
}

function configureSaveSessionModal(igvMain, prefix, saveHandler, saveModalId) {

    const html =
        `<div id="${saveModalId}" class="modal fade igv-app-file-save-modal" tabindex="-1">

        <div class="modal-dialog modal-lg">
    
            <div class="modal-content">
    
                <div class="modal-header">
    
                    <div class="modal-title">
                        <div>
                            Save Session File
                        </div>
                    </div>
    
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
    
                <div class="modal-body">
                    <input class="form-control" type="text" placeholder="igv-app-session.json">
    
                    <div>
                        Enter session filename with .json suffix
                    </div>
    
                </div>
    
                <div class="modal-footer">
                    <button type="button" class="btn btn-sm btn-outline-secondary" data-bs-dismiss="modal">Cancel</button>
                    <button type="button" class="btn btn-sm btn-secondary">OK</button>
                </div>
    
            </div>
    
        </div>
    
    </div>`;


    const fragment = document.createRange().createContextualFragment(html)
    const modalElement = fragment.firstChild

    igvMain.appendChild(modalElement)

    const modal = new bootstrap.Modal(modalElement)

    const inputElement = modalElement.querySelector('input')
    const $input = $(inputElement)

    modalElement.addEventListener('show.bs.modal', () => inputElement.value = `${prefix}-session.json`)

    const okHandler = () => {

        const extensions = new Set(['json', 'xml'])

        let filename = $input.val()

        if (undefined === filename || '' === filename) {
            filename = $input.attr('placeholder')
        } else if (false === extensions.has(FileUtils.getExtension(filename))) {
            filename = filename + '.json'
        }

        const json = saveHandler()

        if (json) {
            const jsonString = JSON.stringify(json, null, '\t')
            const data = URL.createObjectURL(new Blob([jsonString], {type: "application/octet-stream"}))
            FileUtils.download(filename, data)
        }

        modal.hide()
    }

    const okElement = modalElement.querySelector('.modal-footer button:nth-child(2)')
    okElement.addEventListener('click', () => okHandler())

    inputElement.addEventListener('keyup', e => {
        // enter key
        if (13 === e.keyCode) {
            okHandler()
        }
    })

    return modal
}


export { createSessionLoadSaveDropdown }
