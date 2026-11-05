import PocketBase from 'pocketbase';

const pb = new PocketBase('https://woolfolio.ru');

// ОБЯЗАТЕЛЬНО для iOS Safari
pb.autoCancellation(false);

export default pb;
