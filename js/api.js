// js/api.js
const ApiClient = {
    async loginWithNaver() { return this.getUserById(1); },
    async loginWithGoogle() { return this.getUserById(2); },
    async loginAsYujinHelper() { return this.getUserById(3); },

    // 내부 헬퍼 메서드: 통합 MockData에서 사용자 검색
    _findUser(userId) {
        const id = Number(userId);
        if (!window.MockData || !window.MockData.users) return null;
        return window.MockData.users.find(u => u.id === id) || null;
    },

    getUserById(userId) {
        const user = this._findUser(userId);
        if (!user) return null;
        
        return {
            id: user.id,
            name: user.name,
            email: user.email,
            picture: user.picture,
            role: user.role,
            createdDate: user.createdDate,
            modifiedDate: user.modifiedDate
        };
    },

    async getUserInfo(userId) {
        const user = this._findUser(userId);
        if (!user) return null;
        
        return {
            id: 100 + user.id, // USER_INFO_ID 임의 생성
            addr: user.addr,
            tel: user.tel,
            email: user.email,
            password: "",
            isDel: "N",
            gender: user.gender,
            createdDate: user.createdDate,
            modifiedDate: user.modifiedDate,
            user: this.getUserById(userId) // ManyToOne USER_ID join
        };
    },

    async getKimpWorkerProfile(userId) {
        const user = this._findUser(userId);
        if (!user) return null;
        
        return {
            profileId: user.id,
            userId: user.id,
            workedHours: user.workedHours,
            healthCertificateImage: user.healthCertificateImage,
            healthCertificateStatus: user.healthCertificateStatus,
            isManagerQualified: user.isManagerQualified || false
        };
    }
};