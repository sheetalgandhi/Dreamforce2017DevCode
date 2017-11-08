/*
Date 		: 11/01/17
Author		: Codey
Description	: sample Class for DFDemo
*/
public with sharing class DfDemoApexController {

    @AuraEnabled
    public static List<Case> getCases() {
        return [SELECT Id, Reason, CaseNumber,Subject, Account.Name, AccountId  FROM case  order by createdDate limit 50];
    }
}