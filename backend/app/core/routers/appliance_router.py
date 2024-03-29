from typing import Sequence

from fastapi import APIRouter, Depends, status

from sqlmodel import Session

from app.utils import MAX_DAYS_IN_YEAR, Logger, get_session

from app.core.models import appliance_model

from app.core.crud.appliance_crud import (
    appliance_crud,
    appliance_time_daily_crud,
    appliance_time_window_crud,
)

router = APIRouter()


@router.get("/", response_model=list[appliance_model.ApplianceRead])
async def get_appliances(
    *, session: Session = Depends(get_session)
) -> Sequence[appliance_model.Appliance]:
    return appliance_crud.get_multi(session=session)


@router.get("/{id}", response_model=appliance_model.ApplianceRead)
async def get_appliance(
    *, id: int, session: Session = Depends(get_session)
) -> appliance_model.Appliance:
    appliance = appliance_crud.get(session=session, id=id)

    if not appliance:
        Logger.exception(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Appliance with id {id} not found",
        )

    return appliance


@router.post("/", status_code=status.HTTP_201_CREATED)
async def post_appliance(
    *,
    form_data: appliance_model.ApplianceCreate,
    session: Session = Depends(get_session),
) -> None:
    new_appliance = appliance_crud.create(session=session, obj_in=form_data)

    for day in range(1, MAX_DAYS_IN_YEAR + 1):
        appliance_time_daily_crud.create(
            session=session,
            obj_in=appliance_model.ApplianceTimeDailyCreate(
                day=day,
                bitmap_plan_energy=0,
                bitmap_plan_no_energy=0,
                appliance_id=new_appliance.id,
            ),
        )


@router.patch("/{id}", response_model=appliance_model.ApplianceUpdate)
async def update_appliance(
    *,
    id: int,
    appliance: appliance_model.ApplianceUpdate,
    session: Session = Depends(get_session),
) -> appliance_model.ApplianceUpdate:
    current_appliance = appliance_crud.get(session=session, id=id)

    if not current_appliance:
        Logger.exception(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Appliance with id {id} not found",
        )

    # Don't allow the user to update appliances from the default households
    if current_appliance.household_id < 100:
        Logger.exception(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Appliance with id {id} is not allowed to be updated",
        )

    appliance_crud.update(
        session=session,
        db_obj=current_appliance,
        obj_in=appliance,
    )

    return appliance


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_appliance(
    *,
    id: int,
    session: Session = Depends(get_session),
) -> None:
    appliance = appliance_crud.get(session=session, id=id)

    if not appliance:
        Logger.exception(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Appliance with id {id} not found",
        )

    # Don't allow the user to delete appliances from the default households
    if appliance.household_id < 100:
        Logger.exception(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Appliance with id {id} is not allowed to be deleted",
        )

    appliance_crud.remove(session=session, id=id)


# For some reason I need to add a trailing slash to the path for *only* this
# function in order to get it to work. It probably has something to do with
# the way fastapi handles endpoints.
@router.get(
    "/timewindow/",
    response_model=list[appliance_model.ApplianceTimeWindowRead],
)
async def get_appliance_timewindows(
    *, session: Session = Depends(get_session)
) -> Sequence[appliance_model.ApplianceTimeWindow]:
    return appliance_time_window_crud.get_multi(session=session)


@router.get(
    "/timewindow/{id}",
    response_model=appliance_model.ApplianceTimeWindowRead,
)
async def get_appliance_timewindow(
    *, id: int, session: Session = Depends(get_session)
) -> appliance_model.ApplianceTimeWindow:
    timewindow = appliance_time_window_crud.get(session=session, id=id)

    if not timewindow:
        Logger.exception(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Timewindow with id {id} not found",
        )

    return timewindow


@router.post("/timewindow", status_code=status.HTTP_201_CREATED)
async def post_appliance_timewindow(
    *,
    form_data: appliance_model.ApplianceTimeWindowCreate,
    session: Session = Depends(get_session),
) -> None:
    get_appliance_timewindow = appliance_time_window_crud.get_by_appliance_id(
        session=session, appliance_id=form_data.appliance_id
    )

    if get_appliance_timewindow:
        for appliance in get_appliance_timewindow:
            if appliance.day == form_data.day:
                Logger.exception(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Appliance with day {form_data.day} already exists",  # noqa: E501
                )

    appliance_time_window_crud.create(session=session, obj_in=form_data)


@router.patch(
    "/timewindow/{id}",
    response_model=appliance_model.ApplianceTimeWindowUpdate,
)
async def update_appliance_timewindow(
    *,
    id: int,
    appliance_timewindow: appliance_model.ApplianceTimeWindowUpdate,
    session: Session = Depends(get_session),
) -> appliance_model.ApplianceTimeWindowUpdate:
    current_appliance_timewindow = appliance_time_window_crud.get(
        session=session, id=id
    )

    if not current_appliance_timewindow:
        Logger.exception(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"ApplianceTimeWindow with id {id} not found",
        )

    appliance_time_window_crud.update(
        session=session,
        db_obj=current_appliance_timewindow,
        obj_in=appliance_timewindow,
    )

    return appliance_timewindow


@router.delete("timewindow/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_appliance_timewindow(
    *,
    id: int,
    session: Session = Depends(get_session),
) -> None:
    appliance_time_window = appliance_time_window_crud.get(
        session=session, id=id
    )

    if not appliance_time_window:
        Logger.exception(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"ApplianceTimeWindow with id {id} not found",
        )

    appliance_time_window_crud.remove(session=session, id=id)
