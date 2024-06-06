"use strict";

function slider_script(params) {

	const sliders = document.querySelectorAll('.fr-slider');
	const inBuilder = document.querySelector('.iframe.mounted');

	const { isWpgb = false } = params || {};
	if (isWpgb) {
		sliders.forEach((slider) => {


			// remove pagination
			const list = slider.querySelector('.splide__list');

			const pagination = slider.querySelector('.splide__pagination');
			if (pagination) pagination.remove();
			if (list.classList.contains('.wpgb-enabled')) {
				const children = list.children;

				for (let i = 0; i < children.length; i++) {
					children[i].remove();
				}

			}
		});
		return;
	}


	storeID(sliders)
	addSlideClasses(sliders)
	initiateSliders(sliders);
	switchIds(sliders)
	setBreakoutOverflow(sliders)
	// paginationRender(sliders)





	removeExtraPaginationInBuilder(sliders)

	function storeID(sliders) {
		sliders.forEach((slider) => {
			const list = slider.querySelector('.splide__list');
			const children = list.children;
			for (let i = 0; i < children.length; i++) {
				children[i].dataset.slideId = children[i].id
			}
		});
	}

	function addSlideClasses(sliders) {
		sliders.forEach((slider) => {
			const list = slider.querySelector('.splide__list');
			const children = list.children;


			for (let i = 0; i < children.length; i++) {

				if (children[i].classList.contains('brx-nestable-children-placeholder')) {
					continue;
				}
				if (children[i].classList.contains('splide__slide')) {
				}
				children[i].classList.add('splide__slide');
			}

			if (children.length > 1 && inBuilder) {
				for (let i = 0; i < children.length; i++) {
					if (children[i].classList.contains('brx-nestable-children-placeholder')) {
						children[i].remove();
					}
				}
			}

		});
	}

	function switchIds(sliders) {
		sliders.forEach((slider) => {
			const list = slider.querySelector('.splide__list');
			const children = list.children;
			for (let i = 0; i < children.length; i++) {
				const child = children[i]
				const bricksId = child.dataset.slideId
				const splideId = child.id
				child.id = bricksId
				child.dataset.splideSlide = splideId
			}
		});
	}

	// function initiateSliders
	function initiateSliders(sliders) {

		const slidersToSync = Array.from(sliders).filter((slider) => {
			return slider.dataset.frSliderSync === 'true';
		});

		const slidersSingles = Array.from(sliders).filter((slider) => {
			return slider.dataset.frSliderSync === 'false';
		});

		const slidersToSyncByID = slidersToSync.reduce((acc, slider) => {
			const id = slider.dataset.frSliderSyncId;
			if (!acc[id]) {
				acc[id] = [];
			}
			acc[id].push(slider);
			return acc;
		}, {});

		const slidersSync = [];

		Object.keys(slidersToSyncByID).forEach((id) => {
			const slidersInstance = [];
			slidersToSyncByID[id].forEach((slider) => {
				slidersInstance.push(new Splide(slider));
			});

			
			const sortedSliderInstances = slidersInstance.sort((a, b) => {
				const aIsNavigation = JSON.parse(a.root.dataset.splide)?.isNavigation ?? false;
				const bIsNavigation = JSON.parse(b.root.dataset.splide)?.isNavigation ?? false;
				return aIsNavigation - bIsNavigation;
			});

			slidersSync.push({ id, slidersInstance: sortedSliderInstances });

		});

		slidersSync.forEach((group) => {
			group.slidersInstance.forEach((slider, index) => {
				
				slider.on('move', (newIndex) => {
					syncOtherSliders(group.slidersInstance, index, newIndex);
				});


				if (turnAutoScroll(slider.root)) {
					slider.mount(window.splide.Extensions);
				} else {
					slider.mount();
				}

				slider.on('moved', () => {
					updateButtonState(group.id, slider);
				})
				
				updateButtonState(group.id, slider);
			
				if (index === 0) {
					customNavButton(group.id, slider, 'next')
					customNavButton(group.id, slider, 'prev')
					progressBar(group.id, slider)
				}

				window.bricksData.splideInstances[group.id] = slider;

			});
		});

		slidersSingles.forEach((slider) => {
			const splide = new Splide(slider);
			if (turnAutoScroll(slider)) {
				splide.mount(window.splide.Extensions);
			} else {
				splide.mount();
			}

			window.bricksData.splideInstances[slider.id] = splide;
		});

	}
	// end function initiateSliders

	function syncOtherSliders(sliders, sourceIndex, newIndex) {
    sliders.forEach((otherSlider, otherIndex) => {
        if (otherIndex !== sourceIndex) {
            otherSlider.go(newIndex);
        }
    });
	}



	// breakout

	function setBreakoutOverflow(sliders) {
		sliders.forEach((slider) => {
			const isBreakout = slider.dataset.frSliderBreakout;
			if (isBreakout === 'false') return
			const list = slider.querySelector('.fr-slider__list');
			const track = slider.querySelector('.fr-slider__track');
			list.style.overflow = 'visible';
			track.style.overflow = 'visible';

		});
	}

	// Auto Scroll

	function turnAutoScroll(slider) {
		const autoScroll = slider.dataset.frSliderAutoScroll;
		if (autoScroll === 'true') {
			return true;
		}
		return false;
	}

	// Custom Controls

	function getSliderSyncID(slider) {
		if (slider.dataset.frSliderSyncId) {
			return slider.dataset.frSliderSyncId;
		} else {
			return null;
		}
	}

	function customNavButton(id, slider, direction) {
		const customNavs = document.querySelectorAll('.fr-slider-custom-navigation');
		customNavs.forEach((nav) => {
			if (nav.dataset.frSliderNavType === 'next' || nav.dataset.frSliderNavType === 'nextPrev' || nav.dataset.frSliderNavType === 'prev') {
				const syncID = nav.dataset.frSliderNavSyncId;
				if (syncID === id) {
					const buttons = nav.querySelectorAll(`.fr-slider__custom-arrow--${direction}`);
					buttons.forEach((button) => {
						button.addEventListener('click', function () {
							const command = direction === 'next' ? '+1' : '-1';
							slider.go(command);
							updateButtonState(id, slider);  // call updateButtonState after the slide change
						});
					});
				}
			}
		});
	}


	function updateButtonState(id, slider) {
		const customNavs = document.querySelectorAll('.fr-slider-custom-navigation');
		customNavs.forEach((nav) => {
			if (nav.dataset.frSliderNavType === 'next' || nav.dataset.frSliderNavType === 'nextPrev' || nav.dataset.frSliderNavType === 'prev') {
				const syncID = nav.dataset.frSliderNavSyncId;
				if (syncID === id) {
					const buttons = nav.querySelectorAll('.fr-slider__custom-arrow');
					const type = slider.options.type;
					const rewind = slider.options.rewind;
					const getIndex = slider.index;  // get the current slide index
					const slidesCount = slider.length;  // get the total number of slides
					const perPage = slider.options.perPage;  // get the number of slides per page

					if ((getIndex >= slidesCount - perPage) && type !== 'loop' && rewind !== true) {
						buttons[1].setAttribute('disabled', '')
					} else {
						buttons[1].removeAttribute('disabled')
					}

					if (getIndex === 0 && type !== 'loop' && rewind !== true) {
						buttons[0].setAttribute('disabled', '')
					} else {
						buttons[0].removeAttribute('disabled')
					}
				}
			}
		});
	}





	function goToSlide(slider, index) {
		slider.go(index);
	}

	function progressBar(id, slider) {

		const customNavs = document.querySelectorAll('.fr-slider-custom-navigation[data-fr-slider-nav-sync-id="' + id + '"]');
		customNavs.forEach((nav) => {
			if (nav.dataset.frSliderNavType === 'progress') {
				let counter = 0;
				const bar = nav.querySelector('.fr-slider__progress-bar');
				const syncID = nav.dataset.frSliderNavSyncId;
				if (syncID === id) {

					function updateProgress() {
						const end = slider.Components.Controller.getEnd() + 1;
						const rate = Math.min((slider.index + 1) / end, 1);
						bar.style.width = String(100 * rate) + '%';
					}

					updateProgress();
					slider.on('mounted move', updateProgress);


				}

				const buttonsWrapper = nav.querySelector('.fr-slider__progress-buttons');
				const slides = slider.Components.Elements.slides;

				slides.forEach((slide, index) => {

					const button = document.createElement('button');
					button.classList.add('fr-slider__progress-button');
					button.setAttribute('data-index', index);
					buttonsWrapper.appendChild(button);
				});

				const buttons = buttonsWrapper.querySelectorAll('.fr-slider__progress-button');
				buttons.forEach((button) => {
					button.addEventListener('click', function () {
						const index = Number(button.dataset.index);

						slider.go(index);
					});
				});

			}

		});
	}



	function paginationRender(sliders) {

		sliders.forEach((slider) => {
			const paginationList = slider.querySelectorAll('.fr-slider__pagination');
			paginationList.forEach((pagination, index) => {
				if (index === 0) {
					return;
				}
				pagination.remove();
			});

		});
	}


	function sliderOptions(slider) {
		return slider.dataset.splide ? JSON.parse(slider.dataset.splide) : {};
	}


	function removeExtraPaginationInBuilder(sliders) {

		if (inBuilder) {
			sliders.forEach((slider) => {
				const slidesList = slider.querySelector('.splide__list');
				const children = slidesList.children.length;
				const slidesLength = children - 1;
				const paginationList = slider.querySelectorAll('.splide__pagination');

				const options = sliderOptions(slider)

				paginationList.forEach((pagination, index) => {
					if (pagination.children.length > slidesLength) {
						const children = pagination.querySelectorAll('li');
						const childrenLength = children.length;
						children.forEach((child, index) => {
							if (index > slidesLength && options.perPage <= 1) {
								child.remove();
							} else if (index > slidesLength / options.perPage && options.perPage > 1) {
								child.remove();
							}

						});
					}
				});
			});
		}
	}

}

// document.addEventListener("DOMContentLoaded", slider_script);

function wpgb_slider_script() {

	// check for the presence of WP_GRID_Builder
	if (window.WP_Grid_Builder) {
		WP_Grid_Builder.on('init', function (wpgb) {

			// check for wpgb.facets, if no facets dont run the code
			if (wpgb.facets) {
				wpgb.facets.on('appended', function (nodes) {


					let isFacetSlider = false;

					const sliders = document.querySelectorAll('.fr-slider');
					sliders.forEach((slider) => {
						if (slider.querySelector('.wpgb-enabled')) {
							isFacetSlider = true;
							console.log('isFacetSlider', isFacetSlider)
						}
					});

					if (isFacetSlider) {
					slider_script()
					}

				});

				wpgb.facets.on('change', function () {

					let isFacetSlider = false;

					const sliders = document.querySelectorAll('.fr-slider');
					sliders.forEach((slider) => {
						if (slider.querySelector('.wpgb-enabled')) {
							isFacetSlider = true;
							console.log('isFacetSlider', isFacetSlider)
						}
					});

					if (isFacetSlider) {
						slider_script({ isWpgb: true })
					}

					// slider_script({ isWpgb: true })

				});
			}

		});
	}
}

document.addEventListener("DOMContentLoaded", function (e) {

	bricksIsFrontend && slider_script();
	bricksIsFrontend && wpgb_slider_script();

});


