angular.module('orderCloud')
    .factory('OrderSubmittedAudit', OrderSubmittedAudit)
;

function OrderSubmittedAudit($q, OrderCloud) {

    var service = {
        LineItemsAdd: _lineItemsAdd,
        ModifyLineItems:_modifyLineItems
    };
    function _modifyLineItems (arr,order, currentCSRUser, editedLineItem, auditInfo){
        var d = $q.defer();
        var tempAuditInfo ={};
        $q.all(arr).then(function(res){
               if(typeof(auditInfo.Name) === 'undefined'){
                        angular.forEach(auditInfo,function(value, key){
                            tempAuditInfo.Name = key;
                            tempAuditInfo[key] = auditInfo[key];
                           setAuditObject(order, currentCSRUser, tempAuditInfo);
                        });
                   d.resolve(res);
               }else{
                   editedLineItem.Name = auditInfo.Name;
                   editedLineItem.EditFrom = auditInfo.EditFrom;
                   setAuditObject(order, currentCSRUser, editedLineItem);
                   d.resolve(res);
               }
            });
        return d.promise;
    }

    function _lineItemsAdd(order,  currenCSRUser, responseFromCall) {
        responseFromCall.Name = "Create New Line Item";
        setAuditObject(order , currenCSRUser, responseFromCall);
    }

    //HELPERS
    //initialize, set, and patch the auditObject
    function setAuditObject(order , currenCSRUser, responseFromCall){
        var  auditLog =[];
        var partialOrderUpdate;
        var audit = {
                Name: null,
                Edit: {
                    From: null,
                     To:null},
                EditReason: null,
                User: {
                    FirstName: currenCSRUser.FirstName,
                    LastName: currenCSRUser.LastName},
                Date: createDateForXp()
        };
        checkAuditType(audit, responseFromCall);

        if(order.xp.SubmittedOrderAuditLog && order.IsSubmitted === true){
            auditLog = order.xp.SubmittedOrderAuditLog;
            auditLog.unshift(audit);
            partialOrderUpdate ={xp:{SubmittedOrderAuditLog : auditLog} };
            OrderCloud.Orders.Patch(order.ID, partialOrderUpdate);
        }

        if (!order.xp.SubmittedOrderAuditLog && order.IsSubmitted === true ){
            auditLog.unshift(audit);
            partialOrderUpdate ={xp:{SubmittedOrderAuditLog : auditLog} };
            OrderCloud.Orders.Patch(order.ID,partialOrderUpdate);
        }
    }
    //check audit type and set keys accordingly
    function checkAuditType(audit, responseFromCall){
        switch( responseFromCall.Name){
            case "Change Delivery Price":
                audit.Name = responseFromCall.Name;
                audit.Edit.From = responseFromCall[0].TempDeliveryCharges;
                audit.Edit.To = parseFloat(responseFromCall[0].TempCharges["Standard Delivery"]);
                audit.EditReason = responseFromCall[0].xp.deliveryChargeAdjReason;
                break;

            case "Create New Line Item":
                audit.Name = responseFromCall.Name;
                audit.Edit.From = "";
                audit.Edit.To ="ProductID: " + responseFromCall.ProductID;
                audit.EditReason = "";
                break;

            case "Edit Shipping Address":
                audit.Name = responseFromCall.Name;
                audit.Edit.FromShipping = responseFromCall.EditFrom;
                audit.Edit.ToShipping = responseFromCall[0].ShippingAddress;
                audit.EditReason = "";
                break;

            case "UnitPrice":
                audit.Name = responseFromCall.Name;
                audit.Edit.From = responseFromCall[responseFromCall.Name].From;
                audit.Edit.To = responseFromCall[responseFromCall.Name].To;
                break;

            // case "FloristNote":
            // case "ProductNote":
            // case "DeliveryNote":
            //     audit.Edit.From = responseFromCall[responseFromCall.Name].From;
            //     audit.Edit.To = responseFromCall[responseFromCall.Name].To;
            //     break;

            case "CardMessage":
                audit.Name = responseFromCall.Name;
                audit.Edit.FromCardMessage = responseFromCall[responseFromCall.Name].From;
                audit.Edit.ToCardMessage = responseFromCall[responseFromCall.Name].To;
                break;
        }
    }
    //create timestamp
    function createDateForXp() {
        var time = new Date().getTime();
        var date = new Date(time);
        var O = {
            TimeStamp: date,
            String: date.toDateString()
        };
        return O;

    }
    return service;
}