$(document).ready(function () {
  let previusSelectedAddress =
    vtexjs.checkout.orderForm.shippingData.selectedAddresses[0];

  $(window).on("orderFormUpdated.vtex", function (_evt, orderForm) {
    const selectedAddresses = orderForm.shippingData.selectedAddresses[0];
    if (selectedAddresses !== previusSelectedAddress) {
      console.log("cambio la direcciones");
      console.log("previusSelectedAddress", previusSelectedAddress);
      console.log("selectedAddresses", selectedAddresses);

      previusSelectedAddress = selectedAddresses 
    } else {
      console.log("no cambio la direcciones");
    }
  });
});
