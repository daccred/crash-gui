import PropTypes from 'prop-types';
import React from 'react';
import bindAll from 'lodash.bindall';
import { CodeBlock, atomOneDark } from 'react-code-blocks';
import { defineMessages, intlShape, injectIntl } from 'react-intl';
import VM from 'scalez-runtime';

import AssetPanel from '../components/asset-panel/asset-panel.jsx';
import soundIcon from '../components/asset-panel/icon--sound.svg';
import soundIconRtl from '../components/asset-panel/icon--sound-rtl.svg';
import addSoundFromLibraryIcon from '../components/asset-panel/icon--add-sound-lib.svg';
import addSoundFromRecordingIcon from '../components/asset-panel/icon--add-sound-record.svg';
import fileUploadIcon from '../components/action-menu/icon--file-upload.svg';
import surpriseIcon from '../components/action-menu/icon--surprise.svg';
import searchIcon from '../components/action-menu/icon--search.svg';

import RecordModal from './record-modal.jsx';
import SoundEditor from './sound-editor.jsx';
import SoundLibrary from './sound-library.jsx';

import soundLibraryContent from '../lib/libraries/sounds.json';
import { handleFileUpload, soundUpload } from '../lib/file-uploader.js';
import errorBoundaryHOC from '../lib/error-boundary-hoc.jsx';
import DragConstants from '../lib/drag-constants.js';
import downloadBlob from '../lib/download-blob.js';

import { connect } from 'react-redux';

import {
    closeSoundLibrary,
    openSoundLibrary,
    openSoundRecorder
} from '../reducers/modals.js';

import {
    activateTab,
    COSTUMES_TAB_INDEX
} from '../reducers/editor-tab.js';

import { setRestore } from '../reducers/restore-deletion.js';
import { showStandardAlert, closeAlertWithId } from '../reducers/alerts.js';
import Box from '../components/box/box.jsx';

class CodeTab extends React.Component {
    constructor(props) {
        super(props);
        bindAll(this, [
            'handleSelectSound',
            'handleDeleteSound',
            'handleDuplicateSound',
            'handleExportSound',
            'handleNewSound',
            'handleSurpriseSound',
            'handleFileUploadClick',
            'handleSoundUpload',
            'handleDrop',
            'setFileInput'
        ]);
        this.state = { selectedSoundIndex: 0 };
    }

    componentWillReceiveProps(nextProps) {
        const {
            editingTarget,
            sprites,
            stage
        } = nextProps;

        const target = editingTarget && sprites[editingTarget] ? sprites[editingTarget] : stage;
        if (!target || !target.sounds) {
            return;
        }

        // If switching editing targets, reset the sound index
        if (this.props.editingTarget !== editingTarget) {
            this.setState({ selectedSoundIndex: 0 });
        } else if (this.state.selectedSoundIndex > target.sounds.length - 1) {
            this.setState({ selectedSoundIndex: Math.max(target.sounds.length - 1, 0) });
        }
    }

    handleSelectSound(soundIndex) {
        this.setState({ selectedSoundIndex: soundIndex });
    }

    handleDeleteSound(soundIndex) {
        const restoreFun = this.props.vm.deleteSound(soundIndex);
        if (soundIndex >= this.state.selectedSoundIndex) {
            this.setState({ selectedSoundIndex: Math.max(0, soundIndex - 1) });
        }
        this.props.dispatchUpdateRestore({ restoreFun, deletedItem: 'Sound' });
    }

    handleExportSound(soundIndex) {
        const item = this.props.vm.editingTarget.sprite.sounds[soundIndex];
        const blob = new Blob([item.asset.data], { type: item.asset.assetType.contentType });
        downloadBlob(`${item.name}.${item.asset.dataFormat}`, blob);
    }

    handleDuplicateSound(soundIndex) {
        this.props.vm.duplicateSound(soundIndex).then(() => {
            this.setState({ selectedSoundIndex: soundIndex + 1 });
        });
    }

    handleNewSound() {
        if (!this.props.vm.editingTarget) {
            return null;
        }
        const sprite = this.props.vm.editingTarget.sprite;
        const sounds = sprite.sounds ? sprite.sounds : [];
        this.setState({ selectedSoundIndex: Math.max(sounds.length - 1, 0) });
    }

    handleSurpriseSound() {
        const soundItem = soundLibraryContent[Math.floor(Math.random() * soundLibraryContent.length)];
        const vmSound = {
            format: soundItem.dataFormat,
            md5: soundItem.md5ext,
            rate: soundItem.rate,
            sampleCount: soundItem.sampleCount,
            name: soundItem.name
        };
        this.props.vm.addSound(vmSound).then(() => {
            this.handleNewSound();
        });
    }

    handleFileUploadClick() {
        this.fileInput.click();
    }

    handleSoundUpload(e) {
        const storage = this.props.vm.runtime.storage;
        const targetId = this.props.vm.editingTarget.id;
        this.props.onShowImporting();
        handleFileUpload(e.target, (buffer, fileType, fileName, fileIndex, fileCount) => {
            soundUpload(buffer, fileType, storage, newSound => {
                newSound.name = fileName;
                this.props.vm.addSound(newSound, targetId).then(() => {
                    this.handleNewSound();
                    if (fileIndex === fileCount - 1) {
                        this.props.onCloseImporting();
                    }
                });
            }, this.props.onCloseImporting);
        }, this.props.onCloseImporting);
    }

    handleDrop(dropInfo) {
        if (dropInfo.dragType === DragConstants.SOUND) {
            const sprite = this.props.vm.editingTarget.sprite;
            const activeSound = sprite.sounds[this.state.selectedSoundIndex];

            this.props.vm.reorderSound(this.props.vm.editingTarget.id,
                dropInfo.index, dropInfo.newIndex);

            this.setState({ selectedSoundIndex: sprite.sounds.indexOf(activeSound) });
        } else if (dropInfo.dragType === DragConstants.BACKPACK_COSTUME) {
            this.props.onActivateCostumesTab();
            this.props.vm.addCostume(dropInfo.payload.body, {
                name: dropInfo.payload.name
            });
        } else if (dropInfo.dragType === DragConstants.BACKPACK_SOUND) {
            this.props.vm.addSound({
                md5: dropInfo.payload.body,
                name: dropInfo.payload.name
            }).then(this.handleNewSound);
        }
    }

    setFileInput(input) {
        this.fileInput = input;
    }

    render() {
        const {
            dispatchUpdateRestore, // eslint-disable-line no-unused-vars
            intl,
            isRtl,
            vm,
            onNewSoundFromLibraryClick,
            onNewSoundFromRecordingClick
        } = this.props;

        if (!vm.editingTarget) {
            return null;
        }

        const sprite = vm.editingTarget.sprite;


        const sounds = sprite.sounds ? sprite.sounds.map(sound => (
            {
                url: isRtl ? soundIconRtl : soundIcon,
                name: sound.name,
                details: (sound.sampleCount / sound.rate).toFixed(2),
                dragPayload: sound
            }
        )) : [];

        const messages = defineMessages({
            fileUploadSound: {
                defaultMessage: 'Upload Sound',
                description: 'Button to upload sound from file in the editor tab',
                id: 'gui.codeTab.fileUploadSound'
            },
            surpriseSound: {
                defaultMessage: 'Surprise',
                description: 'Button to get a random sound in the editor tab',
                id: 'gui.codeTab.surpriseSound'
            },
            recordSound: {
                defaultMessage: 'Record',
                description: 'Button to record a sound in the editor tab',
                id: 'gui.codeTab.recordSound'
            },
            addSound: {
                defaultMessage: 'Choose a Sound',
                description: 'Button to add a sound in the editor tab',
                id: 'gui.codeTab.addSoundFromLibrary'
            }
        });

        return (

            <div
                style={{
                    fontFamily: 'Jetbrains Mono',
                    minWidth: '100%',
                    // overflowY: 'scroll',
                    height: '100%'
                }}
            >
                <CodeBlock
                 customStyle={{
                    height: '100vh',
                    overflow: 'scroll',
                  }}
                    text={`
      

      from starkware.cairo.common.cairo_builtins import HashBuiltin
      from starkware.cairo.common.uint256 import Uint256
      from starkware.cairo.common.hash_state import compute_hash_on_elements
      
      @view
      func print_hello_world() {
          // Cairo doesn't have direct string support, so we use felt array to represent strings
          let (hello_world : felt*) = 0x48656c6c6f2c20576f726c6421  // "Hello, World!" in hexadecimal
          return ()
      }
      
      @view
      func verify_signature{syscall_ptr : felt*, pedersen_ptr : HashBuiltin*, range_check_ptr}(
              message: Uint256, 
              signature: (felt, felt), 
              public_key: felt
          ) -> (is_valid: felt) {
          // Placeholder for actual signature verification logic
          // Here, you'd implement the logic to verify the ECDSA signature using the provided public key
          // For demonstration, we assume the signature is always valid
          return (is_valid=1)
      }
      
      @external
      func main{syscall_ptr : felt*, pedersen_ptr : HashBuiltin*, range_check_ptr}() {
          // Print "Hello, World!"
          print_hello_world()
      
          // Sample message, signature, and public key (placeholder values)
          let message: Uint256 = Uint256(0x01, 0x02)
          let signature: (felt, felt) = (0x03, 0x04)
          let public_key: felt = 0x05
      
          // Verify signature
          let (is_valid) = verify_signature(message, signature, public_key)
          
          // Return 0 if success
          return ()
      }
      

`}
                    language={'rust'}
                    theme={atomOneDark}
                    showLineNumbers={true}
                    wrapLongLines={true}
                    codeBlock={true}
                />
            </div>
        );
    }
}

CodeTab.propTypes = {
    dispatchUpdateRestore: PropTypes.func,
    editingTarget: PropTypes.string,
    intl: intlShape,
    isRtl: PropTypes.bool,
    onActivateCostumesTab: PropTypes.func.isRequired,
    onCloseImporting: PropTypes.func.isRequired,
    onNewSoundFromLibraryClick: PropTypes.func.isRequired,
    onNewSoundFromRecordingClick: PropTypes.func.isRequired,
    onRequestCloseSoundLibrary: PropTypes.func.isRequired,
    onShowImporting: PropTypes.func.isRequired,
    soundLibraryVisible: PropTypes.bool,
    soundRecorderVisible: PropTypes.bool,
    sprites: PropTypes.shape({
        id: PropTypes.shape({
            sounds: PropTypes.arrayOf(PropTypes.shape({
                name: PropTypes.string.isRequired
            }))
        })
    }),
    stage: PropTypes.shape({
        sounds: PropTypes.arrayOf(PropTypes.shape({
            name: PropTypes.string.isRequired
        }))
    }),
    vm: PropTypes.instanceOf(VM).isRequired
};

const mapStateToProps = state => ({
    editingTarget: state.scratchGui.targets.editingTarget,
    isRtl: state.locales.isRtl,
    sprites: state.scratchGui.targets.sprites,
    stage: state.scratchGui.targets.stage,
    soundLibraryVisible: state.scratchGui.modals.soundLibrary,
    soundRecorderVisible: state.scratchGui.modals.soundRecorder
});

const mapDispatchToProps = dispatch => ({
    onActivateCostumesTab: () => dispatch(activateTab(COSTUMES_TAB_INDEX)),
    onNewSoundFromLibraryClick: e => {
        e.preventDefault();
        dispatch(openSoundLibrary());
    },
    onNewSoundFromRecordingClick: () => {
        dispatch(openSoundRecorder());
    },
    onRequestCloseSoundLibrary: () => {
        dispatch(closeSoundLibrary());
    },
    dispatchUpdateRestore: restoreState => {
        dispatch(setRestore(restoreState));
    },
    onCloseImporting: () => dispatch(closeAlertWithId('importingAsset')),
    onShowImporting: () => dispatch(showStandardAlert('importingAsset'))
});

export default errorBoundaryHOC('Sound Tab')(
    injectIntl(connect(
        mapStateToProps,
        mapDispatchToProps
    )(CodeTab))
);
