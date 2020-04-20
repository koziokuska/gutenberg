/**
 * External dependencies
 */
import { Animated, Easing, View, TouchableWithoutFeedback } from 'react-native';

/**
 * WordPress dependencies
 */
import { ToolbarButton, Toolbar } from '@wordpress/components';
import { useEffect } from '@wordpress/element';
import { withSelect, withDispatch } from '@wordpress/data';
import { compose } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import styles from './styles.scss';
import NavigateUpSVG from './nav-up-icon';
import Breadcrumb from '../block-list/breadcrumb.native';

const EASE_IN_DURATION = 300;
const EASE_OUT_DURATION = 50;
const TRANSLATION_RANGE = 8;

const opacity = new Animated.Value( 0 );

const FloatingToolbar = ( {
	selectedClientId,
	parentId,
	showFloatingToolbar,
	onNavigateUp,
	isRTL,
} ) => {
	useEffect( () => {
		const easing = Easing.ease;
		Animated.timing( opacity, {
			toValue: showFloatingToolbar ? 1 : 0,
			duration: showFloatingToolbar
				? EASE_IN_DURATION
				: EASE_OUT_DURATION,
			easing,
		} ).start();
	}, [ showFloatingToolbar ] );

	const translation = opacity.interpolate( {
		inputRange: [ 0, 1 ],
		outputRange: [ TRANSLATION_RANGE, 0 ],
	} );

	const animationStyle = {
		opacity,
		transform: [ { translateY: translation } ],
	};

	return (
		!! opacity && (
			<TouchableWithoutFeedback accessible={ false }>
				<Animated.View
					style={ [ styles.floatingToolbar, animationStyle ] }
				>
					{ !! parentId && (
						<Toolbar passedStyle={ styles.toolbar }>
							<ToolbarButton
								title={ __( 'Navigate Up' ) }
								onClick={ () => onNavigateUp( parentId ) }
								icon={ <NavigateUpSVG isRTL={ isRTL } /> }
							/>
							<View style={ styles.pipe } />
						</Toolbar>
					) }
					<Breadcrumb clientId={ selectedClientId } />
				</Animated.View>
			</TouchableWithoutFeedback>
		)
	);
};

export default compose( [
	withSelect( ( select ) => {
		const {
			getSelectedBlockClientId,
			getBlockHierarchyRootClientId,
			getBlockRootClientId,
			getBlockCount,
			getSettings,
		} = select( 'core/block-editor' );

		const selectedClientId = getSelectedBlockClientId();

		if ( ! selectedClientId ) return;

		const rootBlockId = getBlockHierarchyRootClientId( selectedClientId );

		return {
			selectedClientId,
			showFloatingToolbar: !! getBlockCount( rootBlockId ),
			parentId: getBlockRootClientId( selectedClientId ),
			isRTL: getSettings().isRTL,
		};
	} ),
	withDispatch( ( dispatch ) => {
		const { selectBlock } = dispatch( 'core/block-editor' );

		return {
			onNavigateUp( clientId, initialPosition ) {
				selectBlock( clientId, initialPosition );
			},
		};
	} ),
] )( FloatingToolbar );
