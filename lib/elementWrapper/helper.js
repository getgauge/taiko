const firstElement = async function(retryInterval, retryTimeout) {
  const elems = await this.elements(retryInterval, retryTimeout);
  if (elems.length < 1) {
    throw new Error(`${this.description} not found`);
  }
  return elems[0];
};
module.exports.firstElement = firstElement;
