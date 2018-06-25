const config = {
    padding: 12,
    fontSize: 10,
    dataPointShape: ['diamond', 'circle', 'triangle', 'rect'],
    colors: ['#7cb5ec', '#f7a35c', '#434348', '#90ed7d', '#f15c80', '#8085e9'],
    radarGridCount: 3,
    radarLabelTextMargin: 15
};

const util={
    approximatelyEqual(num1, num2) {
        return Math.abs(num1 - num2) < 1e-10;
    },
    //计算文字长度
    measureText(text) {
        const fontSize = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : config.fontSize;
        text = String(text).split('');
        // wx canvas 未实现measureText方法, 此处自行实现
        let width = 0;
        text.forEach(function (item) {
            if (/[a-zA-Z]/.test(item)) {
                width += 7;
            } else if (/[0-9]/.test(item)) {
                width += 5.5;
            } else if (/\./.test(item)) {
                width += 2.7;
            } else if (/-/.test(item)) {
                width += 3.25;
            } else if (/[\u4e00-\u9fa5]/.test(item)) {
                width += 10;
            } else if (/\(|\)/.test(item)) {
                width += 3.73;
            } else if (/\s/.test(item)) {
                width += 2.5;
            } else if (/%/.test(item)) {
                width += 8;
            } else {
                width += 10;
            }
        });
        return width * fontSize / 10;
    },
    //颜色
    fillSeriesColor(series, config) {
        let index = 0;
        return series.map(function (item) {
            if (!item.color) {
                item.color = config.colors[index];
                index = (index + 1) % config.colors.length;
            }
            return item;
        });
    },
    //计算平分角度
    getRadarCoordinateSeries(radarRepeatData,length) {
        //等分角度
        const eachAngle = 2 * Math.PI / length;
        //各个角度大小
        let CoordinateSeries = [];
        for (let i = 0; i < length; i++) {
            CoordinateSeries.push(eachAngle * i);
        }
        const coordinateSeries = CoordinateSeries.map(function (item) {
            return -1 * item + Math.PI / 2;
        });
        Object.assign(radarRepeatData, {coordinateSeries});
        //正上方开始绘制
        return coordinateSeries;
    },
    radarCenterPos(radarRepeatData,opts, config) {
        const centerPosition = {
            x: opts.width / 2,
            y: opts.height / 2
        };
        Object.assign(radarRepeatData, {centerPosition});
        return centerPosition;
    },
    getMaxTextListLength(list) {
        const lengthList = list.map(function (item) {
            return util.measureText(item);
        });
        return Math.max(...lengthList);
    },
    convertCoordinateOrigin(x, y, center) {
        return {
            x: center.x + x,
            y: center.y - y
        };
    },
    dataCombine(series) {
        return series.reduce(function (a, b) {
            return (a.data ? a.data : a).concat(b.data);
        }, []);
    },
    isInExactPieChartArea(currentPoints, center, radius) {
        return Math.pow(currentPoints.x - center.x, 2) + Math.pow(currentPoints.y - center.y, 2) <= Math.pow(radius, 2);
    },
    assign(target, varArgs) {
        if (target == null) {
            // TypeError if undefined or null
            throw new TypeError('Cannot convert undefined or null to object');
        }

        const to = Object(target);

        for (let index = 1; index < arguments.length; index++) {
            const nextSource = arguments[index];

            if (nextSource != null) {
                // Skip over if undefined or null
                for (let nextKey in nextSource) {
                    // Avoid bugs when hasOwnProperty is shadowed
                    if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
                        to[nextKey] = nextSource[nextKey];
                    }
                }
            }
        }
        return to;
    }
}

const Timing = {
    easeIn(pos) {
        return Math.pow(pos, 3);
    },

    easeOut(pos) {
        return Math.pow(pos - 1, 3) + 1;
    },
    easeInOut(pos) {
        if ((pos /= 0.5) < 1) {
            return 0.5 * Math.pow(pos, 3);
        } else {
            return 0.5 * (Math.pow(pos - 2, 3) + 2);
        }
    },
    linear(pos) {
        return pos;
    }
};

class Animation {
    constructor(opts){
        this.opts=opts;
        this.isStop = false;
        this.opts.duration = typeof this.opts.duration === 'undefined' ? 1000 : this.opts.duration;
        this.opts.timing = this.opts.timing || 'linear';
        this.delay=17;
        this.startTimeStamp = null;


        this.createAnimationFrame(this.step(), this.delay);
    }
    createAnimationFrame() {
        if (typeof requestAnimationFrame !== 'undefined') {
            return requestAnimationFrame;
        } else if (typeof setTimeout !== 'undefined') {
            return function (step, delay) {
                setTimeout(function () {
                    var timeStamp = +new Date();
                    step(timeStamp);
                }, delay);
            };
        } else {
            return function (step) {
                step(null);
            };
        }
    };
    step(timestamp) {
        if (timestamp === null || this.isStop === true) {
            this.opts.onProcess && this.opts.onProcess(1);
            this.opts.onAnimationFinish && this.opts.onAnimationFinish();
            return;
        }
        if (this.startTimeStamp === null) {
            this.startTimeStamp = timestamp;
        }
        if (timestamp - this.startTimeStamp < this.opts.duration) {
            let process = (timestamp - this.startTimeStamp) / this.opts.duration;
            let timingFunction = Timing[this.opts.timing];
            process = timingFunction(process);
            this.opts.onProcess && this.opts.onProcess(process);
            this.createAnimationFrame(this._step, this.delay);
        } else {
            this.opts.onProcess && this.opts.onProcess(1);
            this.opts.onAnimationFinish && this.opts.onAnimationFinish();
        }
    };
    // stop animation immediately
// and tigger onAnimationFinish
    stop(){
        this.isStop = true;
    }
}

// simple event implement
class Event{
    constructor(){
        this.events = {};
    }
    addEventListener(type, listener){
        this.events[type] = this.events[type] || [];
        this.events[type].push(listener);
    }
    trigger(){
        const _len = arguments.length;
        const args = Array(_len);
        for (let _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
        }
        const [type, ...params] = args;
        if (!!this.events[type]) {
            this.events[type].forEach(function (listener) {
                try {
                    listener.apply(null, params);
                } catch (e) {
                    console.error(e);
                }
            });
        }
    }
}

export class RadarCharts{
    constructor(opts,component){
        this.opts=opts;
        this.component=component;
        this.radarRepeatData={};
        this.opts.extra = this.opts.extra || {};
        this.opts.animation = this.opts.animation === false ? false : true;

        //重置字体大小
        config.fontSize = this.opts.fontSize || config.fontSize;

        this.config = config;
        this.context = wx.createCanvasContext(this.opts.canvasId,this.component);
        // store calcuated chart data
        // such as chart point coordinate
        this.chartData = {};
        this.event = new Event();

        this.drawCharts(this.opts.type, this.opts, config, this.context);
    }
    drawCharts(type, opts, config, context) {
        const _this = this;

        let series = opts.series;
        series = util.fillSeriesColor(series, config);

        const duration = opts.animation ? 50 : 0;
        this.animationInstance && this.animationInstance.stop();
        switch (type) {
            case 'radar':
                this.animationInstance = new Animation({
                    timing: 'easeInOut',
                    duration: duration,
                    onProcess: function onProcess(process) {
                        _this.chartData.radarData = _this.drawRadarDataPoints(series, opts, config, context, process);
                        context.draw();
                    },
                    onAnimationFinish: function onAnimationFinish() {
                        _this.event.trigger('renderComplete');
                    }
                });
                break;
        }
    }
    drawRadarDataPoints(series, opts, config, context) {
        const _this=this;
        const process = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 1;

        let radarOption = opts.extra.radar || {};
        //计算角度
        let coordinateAngle = this.radarRepeatData.coordinateSeries || util.getRadarCoordinateSeries(_this.radarRepeatData,opts.categories.length);
        //原点
        const centerPosition = this.radarRepeatData.centerPosition || util.radarCenterPos(_this.radarRepeatData,opts, config);

        //雷达图可绘制区域
        let radius = Math.min(centerPosition.x - (util.getMaxTextListLength(opts.categories) + config.radarLabelTextMargin), centerPosition.y - config.radarLabelTextMargin);

        radius -= config.padding;
        // draw grid 画图
        context.beginPath();
        context.setLineWidth(1);
        context.setStrokeStyle(radarOption.gridColor || "#cccccc");
        coordinateAngle.forEach(function (angle) {
            //画原点扩张开来的线
            const pos = util.convertCoordinateOrigin(radius * Math.cos(angle), radius * Math.sin(angle), centerPosition);
            context.moveTo(centerPosition.x, centerPosition.y);
            context.lineTo(pos.x, pos.y);
        });
        context.stroke();
        context.closePath();

        // draw split line grid 画维度分割线

        const _loop = function _loop(i) {
            let startPos = {};
            context.beginPath();
            context.setLineWidth(1);
            context.setStrokeStyle(radarOption.gridColor || "#cccccc");
            coordinateAngle.forEach(function (angle, index) {
                const pos = util.convertCoordinateOrigin(radius / config.radarGridCount * i * Math.cos(angle), radius / config.radarGridCount * i * Math.sin(angle), centerPosition);
                if (index === 0) {
                    startPos = pos;
                    context.moveTo(pos.x, pos.y);
                } else {
                    context.lineTo(pos.x, pos.y);
                }
            });
            context.lineTo(startPos.x, startPos.y);
            context.stroke();
            context.closePath();
        };
        for (let i = 1; i <= config.radarGridCount; i++) {
            _loop(i);
        }
        // draw label text
        _this.drawRadarLabel(coordinateAngle, radius, centerPosition, opts, config, context);

        const radarDataPoints = _this.getRadarDataPoints(coordinateAngle, centerPosition, radius, series, opts, process);
        radarDataPoints.forEach(function (eachSeries, seriesIndex) {
            // 绘制区域数据

            context.beginPath();
            const grd = context.createLinearGradient(centerPosition.x, centerPosition.y, 50, 50)
            grd.addColorStop(0, eachSeries.color)
            grd.addColorStop(1, radarOption.gridColor_2)

            // Fill with gradient
            context.setFillStyle(grd)
            context.setShadow(7, 13, 30, radarOption.shadowColor)
            context.setGlobalAlpha(0.7);
            eachSeries.data.forEach(function (item, index) {
                if (index === 0) {
                    context.moveTo(item.position.x, item.position.y);
                } else {
                    context.lineTo(item.position.x, item.position.y);
                }
            });
            context.closePath();
            context.fill();
            context.setGlobalAlpha(1);
            /*if (opts.dataPointShape !== false) {
                var shape = config.dataPointShape[seriesIndex % config.dataPointShape.length];
                var points = eachSeries.data.map(function (item) {
                    return item.position;
                });
                drawPointShape(points, eachSeries.color, shape, context);
            }*/
        });
        return {
            center: centerPosition,
            radius: radius,
            angleList: coordinateAngle
        };
    }
    drawPointShape(points, color, shape, context) {
        context.beginPath();
        context.setStrokeStyle("#ffffff");
        context.setLineWidth(1);
        context.setFillStyle(color);

        if (shape === 'diamond') {
            points.forEach(function (item, index) {
                if (item !== null) {
                    context.moveTo(item.x, item.y - 4.5);
                    context.lineTo(item.x - 4.5, item.y);
                    context.lineTo(item.x, item.y + 4.5);
                    context.lineTo(item.x + 4.5, item.y);
                    context.lineTo(item.x, item.y - 4.5);
                }
            });
        } else if (shape === 'circle') {
            points.forEach(function (item, index) {
                if (item !== null) {
                    context.moveTo(item.x + 3.5, item.y);
                    context.arc(item.x, item.y, 4, 0, 2 * Math.PI, false);
                }
            });
        } else if (shape === 'rect') {
            points.forEach(function (item, index) {
                if (item !== null) {
                    context.moveTo(item.x - 3.5, item.y - 3.5);
                    context.rect(item.x - 3.5, item.y - 3.5, 7, 7);
                }
            });
        } else if (shape === 'triangle') {
            points.forEach(function (item, index) {
                if (item !== null) {
                    context.moveTo(item.x, item.y - 4.5);
                    context.lineTo(item.x - 4.5, item.y + 4.5);
                    context.lineTo(item.x + 4.5, item.y + 4.5);
                    context.lineTo(item.x, item.y - 4.5);
                }
            });
        }
        context.closePath();
        context.fill();
        context.stroke();
    }
    drawRadarLabel(angleList, radius, centerPosition, opts, config, context) {
        const _this=this;
        let radarOption = opts.extra.radar || {};
        radius += config.radarLabelTextMargin;
        context.beginPath();
        context.setFontSize(config.fontSize);
        context.setFillStyle(radarOption.labelColor || '#666666');
        angleList.forEach(function (angle, index) {
            const pos = {
                x: radius * Math.cos(angle),
                y: radius * Math.sin(angle)
            };
            const posRelativeCanvas = util.convertCoordinateOrigin(pos.x, pos.y, centerPosition);
            let startX = posRelativeCanvas.x;
            let startY = posRelativeCanvas.y;
            if (util.approximatelyEqual(pos.x, 0)) {
                startX -= util.measureText(opts.categories[index] || '') / 2;
            } else if (pos.x < 0) {
                startX -= util.measureText(opts.categories[index] || '');
            }
            context.fillText(opts.categories[index] || '', startX, startY + config.fontSize / 2);
        });
        context.stroke();
        context.closePath();
    }
    getRadarDataPoints(angleList, center, radius, series, opts) {
        const process = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : 1;

        //单一维度最高值
        let radarOption = opts.extra.radar || {};
        radarOption.max = radarOption.max || 0;
        const dataList=util.dataCombine(series);
        const maxData = Math.max(radarOption.max, Math.max(...dataList ));

        const data = [];
        series.forEach(function (each) {
            const listItem = {};
            listItem.color = each.color;
            listItem.data = [];
            each.data.forEach(function (item, index) {
                const tmp = {};
                tmp.angle = angleList[index];

                tmp.proportion = item / maxData;
                tmp.position = util.convertCoordinateOrigin(radius * tmp.proportion * process * Math.cos(tmp.angle), radius * tmp.proportion * process * Math.sin(tmp.angle), center);
                listItem.data.push(tmp);
            });

            data.push(listItem);
        });
        return data;
    }
    findRadarChartCurrentIndex(currentPoints, radarData, count) {
        const eachAngleArea = 2 * Math.PI / count;
        let currentIndex = -1;
        if (util.isInExactPieChartArea(currentPoints, radarData.center, radarData.radius)) {
            const fixAngle = function fixAngle(angle) {
                if (angle < 0) {
                    angle += 2 * Math.PI;
                }
                if (angle > 2 * Math.PI) {
                    angle -= 2 * Math.PI;
                }
                return angle;
            };

            let angle = Math.atan2(radarData.center.y - currentPoints.y, currentPoints.x - radarData.center.x);
            angle = -1 * angle;
            if (angle < 0) {
                angle += 2 * Math.PI;
            }

            const angleList = radarData.angleList.map(function (item) {
                item = fixAngle(-1 * item);
                return item;
            });
            angleList.forEach(function (item, index) {
                let rangeStart = fixAngle(item - eachAngleArea / 2);
                let rangeEnd = fixAngle(item + eachAngleArea / 2);
                if (rangeEnd < rangeStart) {
                    rangeEnd += 2 * Math.PI;
                }
                if (angle >= rangeStart && angle <= rangeEnd || angle + 2 * Math.PI >= rangeStart && angle + 2 * Math.PI <= rangeEnd) {
                    currentIndex = index;
                }
            });
        }
        return currentIndex;
    }

    //暴露出来的接口
    addEventListener(type, listener) {
        this.event.addEventListener(type, listener);
    };
    updateData() {
        const data = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

        this.opts.series = data.series || this.opts.series;
        this.opts.categories = data.categories || this.opts.categories;

        this.opts.extra = util.assign({}, this.opts.extra, data.extra || {});

        this.drawCharts(this.opts.type, this.opts, this.config, this.context);
    };
    stopAnimation() {
        this.animationInstance && this.animationInstance.stop();
    };

    getCurrentDataIndex(e) {
        const touches = e.touches && e.touches.length ? e.touches : e.changedTouches;
        if (touches && touches.length) {
            const _touches$ = touches[0],
                x = _touches$.x,
                y = _touches$.y;

            if (this.opts.type === 'radar') {
                return this.findRadarChartCurrentIndex({x: x, y: y}, this.chartData.radarData, this.opts.categories.length);
            }
        }
        return -1;
    };
}
