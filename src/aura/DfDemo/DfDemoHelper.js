({
	 getCaseList: function(component) {       
        var action = component.get("c.getCases");
        action.setCallback(this, function(response) {
        var state = response.getState();
        if (component.isValid() && state === "SUCCESS") {
                component.set("v.caseList", response.getReturnValue());
              }
        });
        $A.enqueueAction(action);

	},
})