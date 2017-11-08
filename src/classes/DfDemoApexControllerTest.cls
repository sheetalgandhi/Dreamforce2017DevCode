/*
Date        : 11/01/17
Author      : Codey
Description : sample Test Class for DFDemo
*/
@isTest
private class DfDemoApexControllerTest {


static testmethod void testcreateTestUserbyRole() {
        createCases();
    	test.startTest();
         List<case> sampleCases = DfDemoApexController.getCases();
      	System.assertEquals(1,sampleCases.size());
    	test.stopTest();
    }
    
    
    
    public Static List<Case> createCases(){
      List<Case> lResults = new List<Case>();
      //CHECKMARX/PMD:CRUD  Access check, abort Insert if not accessible
                Case caseRec = new Case();
                caseRec.Status = 'Waiting on Customer';
                caseRec.Severity_Level__c = 'Level 1 - Critical';
                caseRec.Subject = 'Test Case for DF' ;
                caseRec.Initial_Case_Severity__c = 'Severity -1';
                caseRec.Reason = 'Sample caseReason';
                caseRec.General_Application_Area__c = 'Appexchange';
                caseRec.FunctionalArea__c = 'Channel Order App';
                caseRec.Origin = 'CFL Assist';
                caseRec.Engagement_Start_Date__c = system.Today()+100;
                caseRec.Priority = 'Normal';
                lResults.add(caseRec);
        
        //CHECKMARX/PMD:CRUD  Access check, abort Insert if not accessible
        insert lResults;
        return lResults;
    }
}