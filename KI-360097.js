function ArmarItemsDelCart(sellerItemName) {
  const itemsArray = [];
  const skusID = vtexjs.checkout.orderForm.items;
  for (const skuID of skusID) {
    var itemCart = {
      id: skuID.id,
      quantity: skuID.quantity,
      seller: sellerItemName,
    };
    itemsArray.push(itemCart);
  }

  return itemsArray;
}

function selectBestSellerPerItem(slasSimulationList) {
  const ids = vtexjs.checkout.orderForm.items.map((item) => item.id);
  const bestSellerPerItem = ids.map((id) => {
    return { id: id, seller: "", bestSellerPrice: 0, bestSellerShipping: 0 };
  });
  // por cada id busco el seller
  ids.forEach((id) => {
    const slas = slasSimulationList.filter((s) => s.itemId === id);
    if (slas.length > 0) {
      if (slas.length === 1) {
        // si solo hay un sla
        const bestSeller = bestSellerPerItem.find((b) => b.id === id);
        slas[0].slas.forEach((slaItem) => {
          if (
            bestSeller.bestSellerPrice === 0 ||
            slaItem.price < bestSeller.bestSellerPrice
          ) {
            bestSeller.seller = slas[0].seller;
            bestSeller.bestSellerPrice = slaItem.price;
            bestSeller.bestSellerShipping = parseInt(
              slaItem.shippingEstimate.split("bd")[0]
            );
          } else if (slaItem.price === bestSeller.bestSellerPrice) {
            if (
              parseInt(slaItem.shippingEstimate.split("bd")[0]) <
              bestSeller.bestSellerShipping
            ) {
              bestSeller.seller = slas[0].seller;
              bestSeller.bestSellerPrice = slaItem.price;
              bestSellerShipping = parseInt(
                slaItem.shippingEstimate.split("bd")[0]
              );
            }
          }
        });
      } else {
        // si hay mas de un sla
        slas.forEach((sla) => {
          sla.slas.forEach((slaItem) => {
            const bestSeller = bestSellerPerItem.find((b) => b.id === id);
            if (
              bestSeller.bestSellerPrice === 0 ||
              slaItem.price < bestSeller.bestSellerPrice
            ) {
              bestSeller.seller = sla.seller;
              bestSeller.bestSellerPrice = slaItem.price;
              bestSeller.bestSellerShipping = parseInt(
                slaItem.shippingEstimate.split("bd")[0]
              );
            } else if (slaItem.price === bestSeller.bestSellerPrice) {
              if (
                parseInt(slaItem.shippingEstimate.split("bd")[0]) <
                bestSeller.bestSellerShipping
              ) {
                bestSeller.seller = sla.seller;
                bestSeller.bestSellerPrice = slaItem.price;
                bestSellerShipping = parseInt(
                  slaItem.shippingEstimate.split("bd")[0]
                );
              }
            }
          });
        });
      }
    }
  });

  return bestSellerPerItem;
}

function changeCartItemsSeller(bestSellerPerItem) {
  vtexjs.checkout.getOrderForm().then((orderForm) => {
    const itemsToAdd = [];
    const itemsToRemove = [];

    const orderFormItems = orderForm.items;
    if (orderFormItems.length > 0) {
      orderFormItems.forEach((it, index) => {
        const bestSeller = bestSellerPerItem.find((b) => b.id === it.id);
        if (bestSeller) {
          if (it.seller !== bestSeller.seller) {
            itemsToAdd.push({
              id: it.id,
              quantity: it.quantity,
              seller: bestSeller.seller,
            });
            itemsToRemove.push({ index: index, quantity: 0 });
          }
        }
      });

      if (itemsToAdd.length > 0) {
        vtexjs.checkout.removeItems(itemsToRemove);
        const itemsAux = [];
        itemsToAdd.forEach((item) => {
          var includes = false;
          itemsAux.forEach((itemAux) => {
            if (item.id == itemAux.id) {
              includes = true;
            }
          });
          if (includes) {
            itemsAux.forEach((itemAux) => {
              if (itemAux.id == item.id) {
                itemAux.quantity = itemAux.quantity + item.quantity;
              }
            });
          } else {
            itemsAux.push(item);
          }
        });
        vtexjs.checkout.addToCart(itemsAux);
      }
    }
  });
}

const usualSellers = ["easycle5990001", "easycle5990003"];

const geoCoordinates =
  vtexjs.checkout.orderForm.shippingData.selectedAddresses[0].geoCoordinates;
const country =
  vtexjs.checkout.orderForm.shippingData.selectedAddresses[0].country;
const slaList = [];

//ejecuto la simulación en cada seller
for (const seller of usualSellers) {
  const itemsArray = ArmarItemsDelCart(seller);
  await fetch("/api/checkout/pub/orderForms/simulation?sc=1", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({
      items: itemsArray,
      geoCoordinates: geoCoordinates,
      country: country,
    }),
  })
    .then((response) => response.json())
    .then(function (json) {
      const itemPurchaseConditions =
        json.purchaseConditions.itemPurchaseConditions;
      if (itemPurchaseConditions.length > 0) {
        itemPurchaseConditions.forEach((item) => {
          const slas = item.slas;
          if (slas.length > 0) {
            const slasDelivery = slas.filter(
              (s) => s.deliveryChannel === "delivery"
            );
            slaList.push({
              itemId: item.id,
              seller: item.seller,
              slas: slasDelivery,
            });
          }
        });
      }
    });
}

//busco al mejor seller por item
const bestSellerPerItem = selectBestSellerPerItem(slaList);
console.log("bestSellerPerItem", bestSellerPerItem);
changeCartItemsSeller(bestSellerPerItem);
console.log(vtexjs.checkout.orderForm.items)
