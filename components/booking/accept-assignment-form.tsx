"use client";
import{useActionState}from"react";
import{acceptAssignmentAction,type AssignmentActionState}from"@/features/assignments/assignment.actions";
export function AcceptAssignmentForm({bookingId}:{bookingId:string}){const[state,action,pending]=useActionState(acceptAssignmentAction.bind(null,bookingId),{} as AssignmentActionState);return <form action={action} className="card"><h2>New assignment</h2><p>Accept this job before starting diagnosis.</p>{state.error&&<p className="error" role="alert">{state.error}</p>}{state.success&&<p role="status">{state.success}</p>}<button className="btn" disabled={pending||Boolean(state.success)}>{pending?"Accepting…":state.success?"Accepted":"Accept assignment"}</button></form>}
