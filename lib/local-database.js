function localUri() {
  const uri = process.env.MONGODB_URI || '';
  if (!/^mongodb:\/\/(127\.0\.0\.1|localhost):\d+\/pets_r_us_[a-z0-9_-]+(?:\?.*)?$/.test(uri)) {
    throw new Error('This preparation tool only accepts a local pets_r_us_* database. Azure deployment requires a separately approved plan.');
  }
  return uri;
}
module.exports = { localUri };
