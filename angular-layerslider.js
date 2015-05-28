/**
 * Created by delta54 on 07.03.15.
 */

/**
 * <layer-slider
 * render-url="/api/layerslider/render/"
 * api-url="/api/layerslider/"
 * slider-id="71"
 * image-dir="/images/layerslider/"
 * ng-model="model"
 * options="{
                responsive: false,
                responsiveUnder: 1280,
                layersContainer: 1280,
                skin: 'noskin',
                hoverPrevNext: false,
                pauseOnHover: true,
                showCircleTimer: true,
                skinsPath: '../layerslider/skins/',
                autoPlayVideos: false,
                hoverBottomNav: true
            }"
 ></layer-slider>
 */
(function(){
    'use strict';

    var isNumber = function(n) {
        return !isNaN(parseFloat(n)) && isFinite(n);
    };

    var debug = true;

    var log = function(m){
        if (debug){
            console.log(m);
        }
    };

    angular
        .module('ui.layerslider', [])
        .directive('layerSlider', ['$http', function($http){

            return {
                restrict: 'E',
                replace: true,
                scope: {
                    sliderId: "=",
                    options: "=",
                    imageDir: "@",
                    renderUrl: "@",
                    apiUrl: "@",
                    model: "="
                },
                link: function ($scope, element, attrs) {

                    var loadFonts = function(data){

                        var fontfamily = [];

                        angular.forEach(data.properties.fonts, function(font, font_key){
                            var family = font.family;
                            angular.forEach(font.variants, function(variant, key){
                                family += (key == 0)? ":": ",";
                                family += variant;
                            });

                            var subsets = "";
                            angular.forEach(font.subsets, function(sub, key){
                                if(subsets.indexOf(sub) == -1) {
                                    if (key != 0) {
                                        subsets += ",";
                                    }

                                    subsets += sub;
                                }
                            });

                            fontfamily.push(family+':'+subsets);
                        });

                        if(fontfamily.length == 0) return;

                        WebFont.load({
                            google: {
                                families: fontfamily
                            }
                        });
                    };

                    var updateImageUrl = function(base){
                        base.find('img').each(function(){
                            $(this).data('src', $scope.imageDir + $scope.sliderId + "/" + $(this).attr('name') );
                        });
                    };

                    var serverRender = function(){

                        $http.get($scope.renderUrl + $scope.sliderId)
                            .success(function(data, status, headers, config) {

                                $(element).html(data.slider);

                                var base = $(element);
                                updateImageUrl(base);

                                Play(data);
                            })
                            .error(function(data, status, headers, config) {

                            });
                    };

                    var render = function(data){

                        // Get layerslider contaier
                        var wrapper = $('<div id="slider-wrapper">').appendTo(element);
                        var layerslider = $('<div id="layerslider" class="ls-wp-container ls-container">').appendTo(wrapper);
                        var dir = $scope.imageDir + $scope.sliderId;

                        // Apply global settings
                        layerslider.css({
                            width: data.properties.width,
                            height: data.properties.height,
                            'max-width': data.properties.maxwidth,
                            visibility: 'visible'
                        });

                        // Add backgrounds
                        var backgroundColor = data.properties.backgroundColor;
                        var backgroundImage = data.properties.backgroundimage;
                        if (backgroundColor != '') {
                            layerslider.css({backgroundColor: backgroundColor});
                        }

                        if (backgroundImage != '') {
                            layerslider.css({backgroundImage: 'url(' + dir + "/" + backgroundImage + ')'});
                        }

                        // Iterate over the slides
                        angular.forEach(data.layers, function(slide, slide_key){

                            // not show hidden layers
                            if (slide.properties.hidden) {
                                return true;
                            }

                            // Slide properties
                            var layerprops = '';
                            angular.forEach(slide.properties, function(val, key){
                                layerprops += '' + key + ':' + val + ';';
                            });

                            // Build the Slide
                            var layer = $('<div class="ls-layer">').appendTo(layerslider);
                            layer.attr('data-ls', layerprops);

                            // Get background
                            var background = slide.properties.background;
                            if (background === '[image-url]') {
                                background = post['image-url'];
                            }

                            // Add background
                            if (background != '') {
                                $('<img src="' + dir + "/" + background + '" class="ls-bg">').appendTo(layer);
                            }

                            // Get selected transitions
                            var tr2d = slide.properties['2d_transitions'];
                            var tr3d = slide.properties['3d_transitions'];
                            var tr2dcustom = slide.properties['custom_2d_transitions'];
                            var tr3dcustom = slide.properties['custom_3d_transitions'];

                            // Apply transitions
                            if (tr2d == '' && tr3d == '' && tr2dcustom == '' && tr3dcustom == '') {
                                layer.attr('data-ls', layer.attr('data-ls') + ' transition2d: all; ');
                                layer.attr('data-ls', layer.attr('data-ls') + ' transition3d: all; ');
                            } else {
                                if (tr2d != '') layer.attr('data-ls', layer.attr('data-ls') + ' transition2d: ' + tr2d + '; ');
                                if (tr3d != '') layer.attr('data-ls', layer.attr('data-ls') + ' transition3d: ' + tr3d + '; ');
                                if (tr2dcustom != '') layer.attr('data-ls', layer.attr('data-ls') + ' customtransition2d: ' + tr2dcustom + '; ');
                                if (tr3dcustom != '') layer.attr('data-ls', layer.attr('data-ls') + ' customtransition3d: ' + tr3dcustom + '; ');
                            }

                            // Iterate over layers
                            angular.forEach(slide.sublayers, function(sub, sub_key){

                                // Sublayer properties
                                var sublayerprops = '';
                                angular.forEach(sub.transition, function(val, key){
                                    sublayerprops += '' + key + ':' + val + ';';
                                });

                                // Styles
                                var styles = {};
                                angular.forEach(sub.styles, function(cssVal, cssProp){
                                    if (cssVal !== '') {
                                        if (cssVal.slice(-1) == ';') {
                                            cssVal = cssVal.substring(0, cssVal.length - 1);
                                        }

                                        styles[cssProp] = isNumber(cssVal) ? cssVal + 'px' : cssVal;
                                    }
                                });

                                // Build the sublayer
                                var sublayer;
                                if (sub.media == "img") {

                                    if (sub.image == '') {
                                        return true;
                                    }
                                    if (sub.image == '[image-url]') {
                                        sub.image = post['image-url'];
                                    }

                                    sublayer = $('<img src="' + dir + "/" + sub.image + '" class="ls-s">').appendTo(layer);

                                } else if (sub.media == 'post') {

                                    //...
                                    //TODO add in future

                                } else {
                                    sublayer = $('<' + sub.type + '>').appendTo(layer).html(sub.html).addClass('ls-s');
                                }

                                // Apply styles and attributes
                                sublayer.attr('id', sub_key).attr('style', sub.style).addClass(sub.class)
                                sublayer.css(styles);
                                if (!sub.styles.wordwrap) {
                                    sublayer.css('white-space', 'nowrap');
                                }

                                // Position the element
                                if (sub.top.indexOf('%') != -1) {
                                    sublayer.css({top: sub.top});
                                } else {
                                    sublayer.css({top: parseInt(sub.top)});
                                }

                                if (sub.left.indexOf('%') != -1) {
                                    sublayer.css({left: sub.left});
                                } else {
                                    sublayer.css({left: parseInt(sub.left)});
                                }

                                if (sub.url != '' && sub.url.match(/^\#[0-9]/)) {
                                    sublayer.addClass('ls-linkto-' + sub.url.substr(1));
                                }

                                sublayer.attr('data-ls', sublayerprops);
                            })
                        });

                        Play(data);
                    };

                    var clear = function(){
                        $(element).find("#layerslider")
                            .layerSlider('stop')
                            .remove();
                    };

                    var clientRender = function(){

                        $http.get($scope.apiUrl + $scope.sliderId)
                            .success(function(data, status, headers, config) {

                                var slider = data.slider.data;

                                // deserialize transition, styles
                                angular.forEach(slider.layers, function(layer, layer_key){
                                    angular.forEach(layer.sublayers, function(sublayer, sublayer_key){

                                        if(typeof sublayer.transition != 'undefined') {
                                            sublayer.transition = angular.fromJson(sublayer.transition);
                                        } else {
                                            sublayer.transition = {};
                                        }

                                        if(typeof sublayer.styles != 'undefined') {
                                            sublayer.styles = angular.fromJson(sublayer.styles);
                                        } else {
                                            sublayer.styles = {};
                                        }

                                    });
                                });

                                render(slider);
                            })
                            .error(function(data, status, headers, config) {

                            });
                    };

                    var Play = function(data){

                        loadFonts(data);

                        // apply style
                        if (typeof data.style != 'undefined') {
                            $('<style type="text/css"></style>').appendTo('head').html(data.style);
                        }

                        // Set logo
                        var yourLogo = data.properties.yourLogo;
                        if (yourLogo && yourLogo !== '') {
                            data.properties.yourLogo = $scope.imageDir + $scope.sliderId + '/' + yourLogo
                        }

                        // Get slider settings
                        var options = $.extend(true, {
                            width: data.properties.width,
                            height: data.properties.height,
                            skin: data.properties.skin,
                            skinsPath: '/layerslider/skins/',
                            animateFirstLayer: false,
                            firstLayer: 1,
                            autoStart: true,
                            pauseOnHover: true,
                            autoPlayVideos: false
                        }, data.properties);

                        options.cbInit = eval("("+data.properties.cbInit+")");
                        options.cbStart = eval("("+data.properties.cbStart+")");
                        options.cbStop = eval("("+data.properties.cbStop+")");
                        options.cbPause = eval("("+data.properties.cbPause+")");
                        options.cbAnimStart = eval("("+data.properties.cbAnimStart+")");
                        options.cbAnimStop = eval("("+data.properties.cbAnimStop+")");
                        options.cbPrev = eval("("+data.properties.cbPrev+")");
                        options.cbNext = eval("("+data.properties.cbNext+")");

                        options.skinsPath = (options.skinsPath == "")? '/layerslider/skins/': options.skinsPath;

                        $(element).find(".ls-container")
                            .layerSlider(
                            $.extend(options, $scope.options)
                        );
                    };

                    var Stop = function(){
                        $(element).find("#layerslider")
                            .layerSlider('stop');
                    };

                    // if destroy
                    $scope.$on('$destroy', function() {
                        log("destroy slider");

                        clear();

                        //$scope.$destroy();
                    });

                    if(typeof $scope.sliderId != 'undefined' && typeof $scope.apiUrl != 'undefined'){
                        clientRender();

                    } else if (typeof $scope.renderUrl != 'undefined' && typeof $scope.sliderId != 'undefined' ){
                        serverRender();

                    } else {

                        $scope.$watch('model', function (data) {
                            if(typeof data.properties == 'undefined') return;

                            clear();
                            render(data);
                        });
                    }

                }
            }

        }]);

}());