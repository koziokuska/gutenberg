/**
 * External dependencies
 */
import { partial } from 'lodash';

/**
 * WordPress dependencies
 */
import {
	BlockEditorProvider,
	BlockList,
	WritingFlow,
} from '@wordpress/block-editor';
import { parse, serialize } from '@wordpress/blocks';
import { Placeholder, Spinner, Disabled } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import ReusableBlockEditPanel from './edit-panel';

const EMPTY_ARRAY = [];

export default function ReusableBlockEdit( { attributes, isSelected } ) {
	const { ref } = attributes;

	const {
		theReusableBlock,
		isFetching,
		isSaving,
		isTemporary,
		blocks,
		canUpdateBlock,
		settings,
		title,
	} = useSelect(
		/** @typedef {import('@wordpress/blocks').BlockInstance} BlockInstance */

		/**
		 * @typedef WPReusableBlockEditSelectedData
		 *
		 * @property {?Array<BlockInstance>} blocks           Reusable block
		 *                                                    content parsed as
		 *                                                    blocks.
		 * @property {boolean}               canUpdateBlock   Can the current
		 *                                                    user edit reusable
		 *                                                    blocks.
		 * @property {boolean}               isFetching       Is the reusable
		 *                                                    block being fetched.
		 * @property {boolean}               isSaving         Is the reusable
		 *                                                    block being saved.
		 * @property {?boolean}              isTemporary      Is the reusable
		 *                                                    block temporary.
		 * @property {Object}                settings         Editor settings.
		 * @property {?Object}               theReusableBlock The reusable block.
		 * @property {?string}               title            The reusable block
		 *                                                    title.
		 */

		/**
		 * @param {Function} select
		 *
		 * @return {WPReusableBlockEditSelectedData} The selected data.
		 */
		( select ) => {
			const { canUser } = select( 'core' );
			const { getSettings } = select( 'core/block-editor' );
			const {
				__experimentalGetReusableBlock: getReusableBlock,
				__experimentalIsFetchingReusableBlock: isFetchingReusableBlock,
				__experimentalIsSavingReusableBlock: isSavingReusableBlock,
			} = select( 'core/editor' );
			const reusableBlock = getReusableBlock( ref );

			return {
				theReusableBlock: reusableBlock,
				isFetching: isFetchingReusableBlock( ref ),
				isSaving: isSavingReusableBlock( ref ),
				isTemporary: reusableBlock?.isTemporary ?? null,
				blocks: reusableBlock ? parse( reusableBlock.content ) : null,
				canUpdateBlock:
					!! reusableBlock &&
					! reusableBlock.isTemporary &&
					!! canUser( 'update', 'blocks', ref ),
				settings: getSettings(),
				title: reusableBlock?.title ?? null,
			};
		},
		[ ref ]
	);

	const {
		__experimentalFetchReusableBlocks: fetchReusableBlocks,
		__experimentalUpdateReusableBlock: updateReusableBlock,
		__experimentalSaveReusableBlock: saveReusableBlock,
	} = useDispatch( 'core/editor' );

	const fetchReusableBlock = partial( fetchReusableBlocks, ref );
	const onChange = partial( updateReusableBlock, ref );
	const onSave = partial( saveReusableBlock, ref );

	// Start in edit mode when working with a newly created reusable block.
	// Start in preview mode when we're working with an existing reusable block.
	const [ isEditing, setIsEditing ] = useState( isTemporary ?? false );

	// Local state so changes can be made to the reusable block without having to save them.
	const [ localTitle, setLocalTitle ] = useState( title );
	const [ localBlocks, setLocalBlocks ] = useState( blocks ?? EMPTY_ARRAY );

	useEffect( () => {
		if ( ! theReusableBlock ) {
			fetchReusableBlock();
		}
	}, EMPTY_ARRAY );

	// If the reusable block was changed by saving another instance of the same
	// reusable block in the editor, and if this instance is not currently being
	// edited, update the local state of this instance to match.
	useEffect( () => {
		if ( ! isEditing && ! isSaving ) {
			setLocalTitle( title );
		}
	}, [ title, isEditing, isSaving ] );

	useEffect( () => {
		if ( ! isEditing && ! isSaving ) {
			setLocalBlocks( blocks );
		}
	}, [ blocks, isEditing, isSaving ] );

	function save() {
		onChange( { title: localTitle, content: serialize( localBlocks ) } );
		onSave();
		setIsEditing( false );
	}

	if ( ! theReusableBlock ) {
		if ( isFetching ) {
			return (
				<Placeholder>
					<Spinner />
				</Placeholder>
			);
		}
		return (
			<Placeholder>
				{ __( 'Block has been deleted or is unavailable.' ) }
			</Placeholder>
		);
	}

	let content = (
		<BlockEditorProvider
			settings={ settings }
			value={ localBlocks }
			onChange={ setLocalBlocks }
			onInput={ setLocalBlocks }
		>
			<WritingFlow>
				<BlockList />
			</WritingFlow>
		</BlockEditorProvider>
	);

	if ( ! isEditing ) {
		content = <Disabled>{ content }</Disabled>;
	}

	return (
		<div className="block-library-block__reusable-block-container">
			{ ( isSelected || isEditing ) && (
				<ReusableBlockEditPanel
					isEditing={ isEditing }
					title={ localTitle ?? title }
					isSaving={ isSaving && ! ( isTemporary ?? false ) }
					isEditDisabled={ ! canUpdateBlock }
					onEdit={ () => {
						setIsEditing( true );
					} }
					onChangeTitle={ setLocalTitle }
					onSave={ save }
					onCancel={ () => {
						setIsEditing( false );
					} }
				/>
			) }
			{ content }
		</div>
	);
}
