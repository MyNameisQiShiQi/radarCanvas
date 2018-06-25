/*
雷达图组件
*/
// const wxCharts = require('../../utils/wxcharts');
import {RadarCharts} from "../../utils/radarCharts";
const RadarCanvas = "radarCanvas"
const TestColor={
    girl:{
        color:"#fd9393",
        grid:"#FEA0A0",
        grid_2:"#9A57FF",
        shadow:"#FFC2C2"
    },
    boy:{
        color:"#7b9ef8",
        grid:"#8F8FFF",
        grid_2:"#5DE1FF",
        shadow:"#B3B0FC"
    }
};
const componentUtil={
    systemPreference(){
        const res = wx.getSystemInfoSync();
        const windowWidth = res.windowWidth;
        const RpxW = windowWidth / 750;
        const RpxH = RpxW * 1.1;
        return {RpxW,RpxH,Rpx:RpxW}
    },
    calculateDimension(valueList,MaxDimension){
        let list = [0, 0, 0, 0, 0];
        if (valueList!==undefined&&valueList.length) {
            list = valueList.map(item => {
                const it = parseInt(item / 2.5) + 1;
                return it > MaxDimension ? MaxDimension : it;
            })
        }
        return list;
    }


};

Component({
    //todo 为charts部分参数设置默认值 利于优化与参数识别
    options: {
        multipleSlots: true
    },
    properties: {
        radarData: {
            type: Object,
            value: {},
            observer: function (newVal, oldVal) {
                const radarChart = this.data.radarChart
                if (newVal.id !== '' && newVal.radarList && !isNaN(newVal.radarList[0]) && radarChart !== null && this.data.radarImageMap) {
                    if (this.data.radarImageMap.get(newVal.id)) {
                        this.triggerEventMethod(newVal.id);
                        return
                    }
                    this.setData({id: newVal.id})
                    const partData = this.judge(newVal,this.properties.aspectCanvas.MaxDimension);
                    console.log("beforeRenderCanvas" + new Date().getTime());
                    radarChart.updateData(partData);
                    console.log("afterRenderCanvas" + new Date().getTime());
                }
            }
        },
        aspectCanvas: {
            type: Object,
            value: {}
        }
    },
    data: {
        radarList: [],
        RpxW: 0,
        RpxH: 0,
        Rpx: 0,
        color: TestColor.boy,
        gender: 1,
        id: "",
        radarChart: null
    },
    //生命周期函数
    ready: function () {
        const radarImageMap = new Map();
        this.setData({radarImageMap})
        const that = this;
        const {RpxW, RpxH, Rpx} = componentUtil.systemPreference();
        const {canvasWidth, canvasHeight, fontSize,categories,MaxDimension} = this.properties.aspectCanvas;
        const width = canvasWidth * 2 * RpxW;
        const height = canvasHeight * 2 * RpxH;
        this.setData({RpxW, RpxH, Rpx});
        const data = {
            fontSize: parseInt(fontSize * Rpx),
            canvasId: RadarCanvas,
            animation: true,
            dataPointShape: false,
            type: 'radar',
            categories,
            width,
            height
        };
        const partData = this.judge(this.properties.radarData,MaxDimension);
        Object.assign(data, partData);
        const radarChart = new RadarCharts(data,this);
        radarChart.addEventListener('renderComplete', () => {
            console.log("beforeCanvasTemp" + new Date().getTime());
            wx.canvasToTempFilePath({
                fileType: 'png',
                canvasId: RadarCanvas,
                success(res) {
                    const {radarImageMap, id} = that.data;
                    if (radarImageMap !== undefined) {
                        console.log("afterCanvasTemp" + new Date().getTime());
                        radarImageMap.set(id, res.tempFilePath);
                        that.setData({radarImageMap});
                        that.triggerEventMethod(id);
                    }
                }
            },this)
        });
        this.setData({
            radarChart
        });
    },
    methods: {
        judge(value,MaxDimension) {
            const color = value.gender === 1 ? TestColor.boy : TestColor.girl;
            const dimen = componentUtil.calculateDimension(value.radarList,MaxDimension);
            return {
                extra: {
                    radar: {
                        max: MaxDimension,
                        labelColor: color.color,
                        gridColor: color.grid,
                        gridColor_2: color.grid_2,
                        shadowColor: color.shadow
                    },
                },
                series: [{
                    name: "",
                    data: dimen,
                    color: color.color
                }]
            }
        },
        triggerEventMethod(id) {
            this.triggerEvent('radarTap', this.data.radarImageMap.get(id), {bubbles: true, composed: true});
        }
    }
});

