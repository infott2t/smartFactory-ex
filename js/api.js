const ApiClient = {
    async loginWithNaver() {
        return this.getUserById(1);
    },
    async loginWithGoogle() {
        return this.getUserById(2);
    },
    async loginAsYujinHelper() {
        return this.getUserById(3);
    },
    getUserById(userId) {
        const id = Number(userId);
        if (id === 1) {
            return {
                id: 1,
                name: "최현일",
                email: "tt2t2am1118@naver.com",
                picture: "",
                role: "MANAGER",
                createdDate: new Date().toISOString(),
                modifiedDate: new Date().toISOString()
            };
        } else if (id === 2) {
            return {
                id: 2,
                name: "최수아",
                email: "capegon21@gmail.com",
                picture: "",
                role: "USER",
                createdDate: new Date().toISOString(),
                modifiedDate: new Date().toISOString()
            };
        } else if (id === 3) {
            return {
                id: 3,
                name: "김수민",
                email: "capegon23@gmail.com",
                picture: "",
                role: "USER",
                createdDate: new Date().toISOString(),
                modifiedDate: new Date().toISOString()
            };
        }
        return null;
    },
    async getUserInfo(userId) {
        const id = Number(userId);
        const userObj = this.getUserById(id);
        if (id === 1) {
            return {
                id: 101, // USER_INFO_ID
                addr: "서울특별시 마포구 대흥동",
                tel: "010-1111-1111",
                email: "tt2t2am1118@naver.com",
                password: "",
                isDel: "N",
                gender: "M",
                createdDate: new Date().toISOString(),
                modifiedDate: new Date().toISOString(),
                user: userObj // ManyToOne USER_ID join
            };
        } else if (id === 2) {
            return {
                id: 102, // USER_INFO_ID
                addr: "서울특별시 서대문구 신촌동",
                tel: "010-2222-2222",
                email: "capegon21@gmail.com",
                password: "",
                isDel: "N",
                gender: "F",
                createdDate: new Date().toISOString(),
                modifiedDate: new Date().toISOString(),
                user: userObj // ManyToOne USER_ID join
            };
        } else if (id === 3) {
            return {
                id: 103, // USER_INFO_ID
                addr: "서울특별시 영등포구 여의도동",
                tel: "010-3333-3333",
                email: "capegon23@gmail.com",
                password: "",
                isDel: "N",
                gender: "F",
                createdDate: new Date().toISOString(),
                modifiedDate: new Date().toISOString(),
                user: userObj // ManyToOne USER_ID join
            };
        }
        return null;
    },
    async getKimpWorkerProfile(userId) {
        const id = Number(userId);
        if (id === 1) {
            return {
                profileId: 1,
                userId: 1,
                workedHours: 32,
                healthCertificateImage: "choi_cert.png",
                healthCertificateStatus: "approved",
                isManagerQualified: true
            };
        } else if (id === 2) {
            return {
                profileId: 2,
                userId: 2,
                workedHours: 15,
                healthCertificateImage: "sua_cert.png",
                healthCertificateStatus: "approved"
            };
        } else if (id === 3) {
            return {
                profileId: 3,
                userId: 3,
                workedHours: 0,
                healthCertificateImage: null,
                healthCertificateStatus: null
            };
        }
        return null;
    }
};
