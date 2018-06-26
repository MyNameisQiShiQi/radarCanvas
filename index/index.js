const app = getApp()

Page({
    data: {
        aspectCanvas: {
            canvasWidth: 392,
            canvasHeight: 366,
            fontSize: 40,
            categories: ['智商', '高贵', '暖心', '吃货', '颜值'],
            MaxDimension:5
        },
        currentPetNumber: 'm000225',
        dimension: [2, 3,5, 1, 0],
        radarData: {},
        currentRadarImage: ""
    },
    onLoad: function () {
    },
    onShow() {
        setTimeout(()=>{
            const radarData = this.returnRadarData(this.data.dimension);
            this.setData({radarData});
            const {gender, id, radarList} = this.data.radarData;
            console.log(gender, id, radarList);
        },500)
    },
    returnRadarData(dimension) {
        const petNumber = this.data.currentPetNumber;
        return {
            gender: 1,
            id: petNumber,
            radarList: dimension
        };
    },
    radarUpdate(e) {
        //传回来雷达图片
        this.setData({currentRadarImage: e.detail});
    },
})
