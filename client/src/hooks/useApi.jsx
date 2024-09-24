import axios from 'axios';

const api = {
    getData: () => axios.get(`/api/import`),
};

export default api;